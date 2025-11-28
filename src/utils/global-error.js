import { deleteCloud } from "./fileUpload/file-functions.js";

export const globalError = async (err, req, res, next) => {
  let code = err.statusCode || 500;
  if(req.file){
      deleteCloud(req.file.path)
  }
  if (req.failImages){
      for (const public_id of failImages) {
         await deleteCloud(public_id)
      }
  }
  res.status(code).json({
    error: "Error: ",
    message: err.message,
    code,
    sucess: false,
  });
};
