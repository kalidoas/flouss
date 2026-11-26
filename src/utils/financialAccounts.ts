import { FinancialAccount, Transaction } from '../types';
import { money } from '../lib/currency';

export function createPrimaryFinancialAccount(accountId: string, openingBalance: number | null): FinancialAccount {
  return {
    id: `financial_${accountId}_primary`,
    name: '',
    type: 'cash',
    openingBalance: typeof openingBalance === 'number' && Number.isFinite(openingBalance) ? openingBalance : 0,
    isPrimary: true,
    createdAt: '',
  };
}

export function resolveFinancialAccounts(
  accountId: string,
  openingBalance: number | null,
  accounts?: FinancialAccount[]
): FinancialAccount[] {
  return Array.isArray(accounts) && accounts.length
    ? accounts
    : [createPrimaryFinancialAccount(accountId, openingBalance)];
}

export function calculateFinancialAccountBalances(
  accounts: FinancialAccount[],
  transactions: Transaction[] = []
): Record<string, number> {
  const balances = Object.fromEntries(
    accounts.map((account) => [account.id, money.toCents(Number(account.openingBalance) || 0)])
  ) as Record<string, number>;
  const primaryId = accounts.find((account) => account.isPrimary)?.id ?? accounts[0]?.id;

  for (const tx of transactions) {
    const amount = money.toCents(Number(tx.amount) || 0);
    if (tx.type === 'transfer') {
      if (tx.fromAccountId && tx.fromAccountId in balances) balances[tx.fromAccountId] -= amount;
      if (tx.toAccountId && tx.toAccountId in balances) balances[tx.toAccountId] += amount;
      continue;
    }

    const accountId = tx.accountId && tx.accountId in balances ? tx.accountId : primaryId;
    if (!accountId) continue;
    if (tx.type === 'income' || tx.type === 'goal_withdraw') balances[accountId] += amount;
    else if (tx.type === 'expense' || tx.type === 'contribution') balances[accountId] -= amount;
    else if (tx.type === 'adjustment') balances[accountId] += amount;
  }

  return Object.fromEntries(Object.entries(balances).map(([id, cents]) => [id, money.round(cents / 100)]));
}
