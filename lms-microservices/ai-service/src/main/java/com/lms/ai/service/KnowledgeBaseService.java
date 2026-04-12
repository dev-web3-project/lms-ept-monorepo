package com.lms.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeBaseService {

    private final VectorStore vectorStore;
    private final TextExtractionService textExtractionService;

    @Async
    public void indexMaterial(Long materialId, String moduleId, String fileUrl) {
        log.info("Starting indexing for material {} in module {}", materialId, moduleId);
        try {
            // 1. Extract text
            String content = textExtractionService.extractTextFromUrl(fileUrl);
            
            // 2. Chunking (Simple chunking by words for now)
            List<String> chunks = splitText(content, 1000);
            
            List<Document> documents = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                Document doc = new Document(chunks.get(i), Map.of(
                    "materialId", materialId,
                    "moduleId", moduleId,
                    "chunkIndex", i
                ));
                documents.add(doc);
            }

            // 3. Store in Vector Database
            vectorStore.add(documents);
            log.info("Successfully indexed {} chunks for material {}", documents.size(), materialId);
            
        } catch (Exception e) {
            log.error("Error indexing material {}: {}", materialId, e.getMessage());
        }
    }

    private List<String> splitText(String text, int wordsPerChunk) {
        String[] words = text.split("\\s+");
        List<String> chunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        int count = 0;

        for (String word : words) {
            currentChunk.append(word).append(" ");
            count++;
            if (count >= wordsPerChunk) {
                chunks.add(currentChunk.toString().trim());
                currentChunk = new StringBuilder();
                count = 0;
            }
        }
        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString().trim());
        }
        return chunks;
    }
}
