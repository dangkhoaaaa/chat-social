const { cloudinary } = require("../config/cloudinary");
const crypto = require("crypto");

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

/**
 * Upload file to Cloudinary
 * @param {File} file - File object (from multer)
 * @param {String} folder - Folder path in storage (e.g., 'images', 'videos', 'avatars')
 * @returns {Promise<Object>} - { url, fileName }
 */
const uploadFile = async (file, folder = "uploads") => {
  configureCloudinary();
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `${crypto.randomUUID()}-${file.originalname}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Upload error:", error);
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              fileName: result.public_id,
              fileType: result.resource_type,
              fileSize: result.bytes,
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  } catch (error) {
    console.error("Upload file error:", error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {String} fileName - File name in storage (public_id)
 * @returns {Promise<void>}
 */
const deleteFile = async (fileName) => {
  configureCloudinary();
  try {
    if (!fileName) {
      return;
    }
    await cloudinary.uploader.destroy(fileName);
    console.log(`File ${fileName} deleted successfully`);
  } catch (error) {
    console.error("Delete file error:", error);
    throw error;
  }
};

/**
 * Upload base64 image to Cloudinary
 * @param {String} base64String - Base64 encoded image
 * @param {String} folder - Folder path in storage
 * @returns {Promise<Object>} - { url, fileName }
 */
const uploadBase64 = async (base64String, folder = "uploads") => {
  configureCloudinary();
  try {
    if (!base64String) {
      throw new Error("No base64 string provided");
    }

    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      fileName: result.public_id,
      fileType: result.resource_type,
      fileSize: result.bytes,
    };
  } catch (error) {
    console.error("Upload base64 error:", error);
    throw error;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  uploadBase64,
};

