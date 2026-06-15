export const SHARED_DEMO_CODE = 'demo123';

export const demoAuthAccounts = [
  {
    userId: 'usr-owner',
    email: 'rina.wijaya@simo.test',
    demoCode: 'owner-demo',
  },
  {
    userId: 'usr-pm',
    email: 'budi.santoso@simo.test',
    demoCode: 'pm-demo',
  },
  {
    userId: 'usr-foreman',
    email: 'joko.anwar@simo.test',
    demoCode: 'foreman-demo',
  },
  {
    userId: 'usr-qc',
    email: 'siti.nurhaliza@simo.test',
    demoCode: 'qc-demo',
  },
  {
    userId: 'usr-admin',
    email: 'dewi.lestari@simo.test',
    demoCode: 'admin-demo',
  },
];

export function getDemoAuthAccountByUserId(userId) {
  return demoAuthAccounts.find((account) => account.userId === userId);
}

export function isValidDemoCode(userId, credential) {
  const account = getDemoAuthAccountByUserId(userId);
  const submittedCode = String(credential || '').trim();

  return Boolean(
    submittedCode
      && account
      && (submittedCode === SHARED_DEMO_CODE || submittedCode === account.demoCode),
  );
}
