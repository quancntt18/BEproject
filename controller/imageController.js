// controllers/imageController.js

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const History = require("../models/historyModel");

// Khởi tạo client của Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cấu hình an toàn để ít bị chặn hơn trong môi trường phát triển.
// Các model ảnh thường nhạy cảm hơn.
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Hàm tiện ích chuyển file ảnh sang định dạng Base64 mà API Gemini yêu cầu.
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}

/**
 * Controller xử lý việc tạo/chỉnh sửa ảnh bằng model gemini-2.5-flash-image-preview.
 */
const generateImage = async (req, res) => {
  console.log('Bắt đầu xử lý generateImage với model gemini-2.5-flash-image-preview...');
  
  try {
    // --- BƯỚC 1: KIỂM TRA DỮ LIỆU ĐẦU VÀO ---
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("Vui lòng tải lên ít nhất một ảnh.");
    }
    const { prompt } = req.body;
    if (!prompt || prompt.trim() === "") {
        return res.status(400).send("Vui lòng nhập mô tả (prompt).");
    }

    // --- BƯỚC 2: KHỞI TẠO MODEL VÀ GỬI YÊU CẦU ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      safetySettings 
    });
    
    const imageParts = req.files.map((file) =>
      fileToGenerativePart(file.path, file.mimetype)
    );
    
    console.log('Đang gửi prompt và ảnh đến Gemini...');
    // Gửi cả prompt và các ảnh trong một mảng
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    console.log('Đã nhận phản hồi từ Gemini.');

    // --- BƯỚC 3: TRÍCH XUẤT, CHUYỂN ĐỔI VÀ LƯU ẢNH KẾT QUẢ ---
    
    // Tìm phần dữ liệu ảnh trong mảng 'parts' của phản hồi
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (!imagePart) {
      // Xử lý trường hợp Gemini không trả về ảnh (có thể bị bộ lọc an toàn chặn)
      console.error("Gemini không trả về dữ liệu ảnh. Phản hồi text:", response.text());
      return res.status(500).send("AI không thể tạo ảnh từ yêu cầu này. Có thể do vi phạm chính sách an toàn hoặc prompt không phù hợp.");
    }

    // Lấy dữ liệu ảnh dưới dạng chuỗi Base64 và kiểu MIME
    const base64ImageData = imagePart.inlineData.data;
    const imageMimeType = imagePart.inlineData.mimeType;
    const imageExtension = imageMimeType.split('/')[1] || 'png'; // Lấy đuôi file, ví dụ: 'png'

    // Tạo tên file duy nhất cho ảnh mới
    const uniqueFilename = `${Date.now()}-generated.${imageExtension}`;
    const destinationPath = path.join(__dirname, '..', 'generated', uniqueFilename);
    
    // Ghi file ảnh mới từ dữ liệu Base64
    fs.writeFileSync(destinationPath, Buffer.from(base64ImageData, 'base64'));

    const resultImageUrl = `/generated/${uniqueFilename}`;
    console.log(`Đã tạo và lưu ảnh mới thành công tại: ${resultImageUrl}`);
    
    // --- BƯỚC 4: LƯU VÀO CƠ SỞ DỮ LIỆU ---
    await new History({
      userId: req.user.id,
      prompt: prompt,
      inputImageUrls: req.files.map((file) => `/uploads/${file.filename}`),
      resultImageUrl: resultImageUrl,
    }).save();

    // --- BƯỚC 5: GỬI KẾT QUẢ VỀ CHO FRONTEND ---
    res.status(200).json({ result: "Ảnh đã được tạo thành công!", imageUrl: resultImageUrl });

  } catch (error) {
    // Bắt các lỗi từ API của Google và báo lại cho client
    console.error("LỖI TRONG QUÁ TRÌNH GỌI API GEMINI:", error);
    res.status(500).send("Có lỗi xảy ra từ API của AI. Vui lòng kiểm tra lại API key, billing, và tên model.");
  } finally {
    // --- BƯỚC 6: DỌN DẸP CÁC FILE TẠM ---
    if (req.files) {
      req.files.forEach((file) => {
        try { fs.unlinkSync(file.path); } catch (e) { console.error("Lỗi khi xóa file tạm:", e); }
      });
    }
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử:", error);
    res.status(500).send("Lỗi khi lấy lịch sử.");
  }
};

module.exports = {
  generateImage,
  getHistory,
};