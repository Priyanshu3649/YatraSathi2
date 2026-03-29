const svc = require('../billCancellationService');

describe('billCancellationService', () => {
  test('canUserCancelBill allows admin usertype', () => {
    expect(svc.canUserCancelBill({ us_usertype: 'admin' })).toBe(true);
  });

  test('canUserCancelBill allows ADM / ACC / MGT', () => {
    expect(svc.canUserCancelBill({ us_roid: 'ADM' })).toBe(true);
    expect(svc.canUserCancelBill({ us_roid: 'ACC' })).toBe(true);
    expect(svc.canUserCancelBill({ us_roid: 'MGT' })).toBe(true);
  });

  test('canUserCancelBill denies AGT', () => {
    expect(svc.canUserCancelBill({ us_roid: 'AGT' })).toBe(false);
  });

  test('billIsAlreadyCancelled', () => {
    expect(svc.billIsAlreadyCancelled({ is_cancelled: 1 })).toBe(true);
    expect(svc.billIsAlreadyCancelled({ bl_status: 'CANCELLED' })).toBe(true);
    expect(svc.billIsAlreadyCancelled({ bl_status: 'DRAFT' })).toBe(false);
  });

  test('billHasBlockingPaymentState', () => {
    expect(svc.billHasBlockingPaymentState({ payment_status: 'FULLY_PAID' })).toBe(true);
    expect(svc.billHasBlockingPaymentState({ payment_status: 'PARTIALLY_PAID' })).toBe(true);
    expect(svc.billHasBlockingPaymentState({ bl_status: 'PAID' })).toBe(true);
    expect(svc.billHasBlockingPaymentState({ bl_status: 'FINAL' })).toBe(true);
    expect(svc.billHasBlockingPaymentState({ bl_status: 'CONFIRMED', payment_status: 'UNPAID' })).toBe(false);
  });

  test('validateCancellationPayload requires reason, date, approver', () => {
    const errs = svc.validateCancellationPayload({}, { bl_total_amount: 100 });
    expect(errs.some((e) => e.includes('reason'))).toBe(true);
    expect(errs.some((e) => e.includes('Cancellation date'))).toBe(true);
    expect(errs.some((e) => e.includes('Approver'))).toBe(true);
  });

  test('validateCancellationPayload rejects charges above bill total', () => {
    const errs = svc.validateCancellationPayload(
      {
        reason: 'x',
        cancellationDate: '2026-03-29',
        approverUserId: 'ADM001',
        approverName: 'Boss',
        railwayCharges: 80,
        agentCharges: 30
      },
      { bl_total_amount: 100 }
    );
    expect(errs.some((e) => e.includes('cannot exceed'))).toBe(true);
  });

  test('generateCancellationReference format', () => {
    const ref = svc.generateCancellationReference();
    expect(ref).toMatch(/^CAN-\d{6}-\d{5}$/);
  });

  test('assertNoReceiptsBlockingCancel', () => {
    expect(svc.assertNoReceiptsBlockingCancel(100, 0).length).toBeGreaterThan(0);
    expect(svc.assertNoReceiptsBlockingCancel(0, 100).length).toBe(0);
  });
});
