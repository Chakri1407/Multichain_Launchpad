use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("CE8E6sTzt6eWy5ytukxCPYjaPS96RVeCEhb9TWbkp3cd");

#[program]
pub mod launchpad {
    use super::*;

    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        name: String,
        description: String,
        goal_amount: u64,
        duration: i64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let owner = &ctx.accounts.owner;
        let clock = Clock::get()?;

        require!(goal_amount > 0, LaunchpadError::InvalidGoalAmount);
        require!(duration > 0, LaunchpadError::InvalidDuration);
        require!(name.len() <= 32, LaunchpadError::NameTooLong);
        require!(description.len() <= 200, LaunchpadError::DescriptionTooLong);

        project.owner = owner.key();
        project.name = name;
        project.description = description;
        project.goal_amount = goal_amount;
        project.current_amount = 0;
        project.start_time = clock.unix_timestamp;
        project.end_time = clock.unix_timestamp + duration;
        project.is_active = true;
        project.goal_reached = false;

        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let contributor = &ctx.accounts.contributor;
        let clock = Clock::get()?;

        require!(project.is_active, LaunchpadError::ProjectNotActive);
        require!(
            clock.unix_timestamp < project.end_time,
            LaunchpadError::ProjectEnded
        );
        require!(amount > 0, LaunchpadError::InvalidContributionAmount);

        let contribution = &mut ctx.accounts.contribution;
        contribution.contributor = contributor.key();
        contribution.amount = amount;
        contribution.withdrawn = false;

        project.current_amount = project
            .current_amount
            .checked_add(amount)
            .ok_or(LaunchpadError::Overflow)?;

        if project.current_amount >= project.goal_amount {
            project.goal_reached = true;
        }

        // Transfer SOL from contributor to project vault
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: contributor.to_account_info(),
                to: ctx.accounts.project_vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let clock = Clock::get()?;

        require!(
            project.owner == ctx.accounts.owner.key(),
            LaunchpadError::Unauthorized
        );
        require!(project.goal_reached, LaunchpadError::GoalNotReached);
        require!(
            clock.unix_timestamp >= project.end_time,
            LaunchpadError::ProjectNotEnded
        );

        let vault_balance = ctx.accounts.project_vault.lamports();
        **ctx.accounts.project_vault.try_borrow_mut_lamports()? -= vault_balance;
        **ctx.accounts.owner.try_borrow_mut_lamports()? += vault_balance;

        project.is_active = false;

        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let project = &ctx.accounts.project;
        let contribution = &mut ctx.accounts.contribution;
        let clock = Clock::get()?;

        require!(!project.goal_reached, LaunchpadError::GoalReached);
        require!(
            clock.unix_timestamp >= project.end_time,
            LaunchpadError::ProjectNotEnded
        );
        require!(!contribution.withdrawn, LaunchpadError::AlreadyWithdrawn);

        let refund_amount = contribution.amount;
        contribution.withdrawn = true;

        // Transfer SOL from project vault back to contributor
        **ctx.accounts.project_vault.try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.contributor.try_borrow_mut_lamports()? += refund_amount;

        Ok(())
    }

    pub fn get_remaining_time(ctx: Context<GetProjectInfo>) -> Result<i64> {
        let project = &ctx.accounts.project;
        let clock = Clock::get()?;

        if clock.unix_timestamp >= project.end_time {
            return Ok(0);
        }

        Ok(project.end_time - clock.unix_timestamp)
    }

    pub fn get_progress(ctx: Context<GetProjectInfo>) -> Result<f64> {
        let project = &ctx.accounts.project;

        Ok((project.current_amount as f64 / project.goal_amount as f64) * 100.0)
    }
}

#[derive(Accounts)]
pub struct InitializeProject<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 4 + 32 + 4 + 200 + 8 + 8 + 8 + 8 + 1 + 1
    )]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    #[account(
        init,
        payer = contributor,
        space = 8 + 32 + 8 + 1
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(mut)]
    pub project_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub project_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    #[account(mut)]
    pub project_vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetProjectInfo<'info> {
    pub project: Account<'info, Project>,
}

#[account]
pub struct Project {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub goal_amount: u64,
    pub current_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub is_active: bool,
    pub goal_reached: bool,
}

#[account]
pub struct Contribution {
    pub contributor: Pubkey,
    pub amount: u64,
    pub withdrawn: bool,
}

#[error_code]
pub enum LaunchpadError {
    #[msg("Invalid goal amount")]
    InvalidGoalAmount,
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("Name too long")]
    NameTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Project is not active")]
    ProjectNotActive,
    #[msg("Project has ended")]
    ProjectEnded,
    #[msg("Invalid contribution amount")]
    InvalidContributionAmount,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Goal not reached")]
    GoalNotReached,
    #[msg("Project not ended")]
    ProjectNotEnded,
    #[msg("Goal already reached")]
    GoalReached,
    #[msg("Already withdrawn")]
    AlreadyWithdrawn,
}
