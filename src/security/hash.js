import bcrypt from "bcryptjs";

async function hash(plain) {
  return await bcrypt.hash(plain, 10);
}
async function compare(plain, hash) {
  return await bcrypt.compare(plain, hash);
}
const hashUtils = { hash, compare };
export default hashUtils;
