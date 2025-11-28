import bcrypt from "bcryptjs";

export const hashedPass = ({ password = "", saltRounds = 8 }) => {
  return bcrypt.hashSync(password, saltRounds);
};

export const comparePass = ({ password = "", hashPass = "" }) => {
  return bcrypt.compareSync(password, hashPass);
};