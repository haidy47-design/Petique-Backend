import cloudinary from './cloudinary.js'

export const deleteCloud = async (public_id)=>{
    await cloudinary.uploader.destroy(public_id)
};