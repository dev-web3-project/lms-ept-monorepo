package com.lms.ai.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

@Service
public class TextExtractionService {

    @Value("${app.upload.dir:${UPLOAD_DIR:./uploads}}")
    private String uploadDir;

    public String extractTextFromMultipartFile(MultipartFile file) throws IOException {
        try (InputStream is = file.getInputStream();
             PDDocument document = Loader.loadPDF(is.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    public String extractTextFromUrl(String fileUrl) throws IOException {
        InputStream is = null;
        try {
            File localFile = new File(uploadDir, fileUrl);
            if (localFile.exists()) {
                is = new FileInputStream(localFile);
            } else {
                is = new URL(fileUrl).openStream();
            }

            byte[] bytes = is.readAllBytes();

            // Simple check: if it's a PDF, use PDFBox, otherwise treat as plain text
            if (fileUrl.toLowerCase().endsWith(".pdf")) {
                try (PDDocument document = Loader.loadPDF(bytes)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(document);
                }
            } else {
                return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
            }
        } finally {
            if (is != null) {
                is.close();
            }
        }
    }
}
