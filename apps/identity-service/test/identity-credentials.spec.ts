import * as bcrypt from 'bcryptjs';

describe('identity credentials', () => {
  it('hashes and verifies passwords', async () => {
    const hash = await bcrypt.hash('StudyPass1!', 10);
    expect(await bcrypt.compare('StudyPass1!', hash)).toBe(true);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });
});
