package com.lms.course.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "ai-service")
public interface AiClient {

    @PostMapping("/api/ai/chatbot/index-material")
    void indexMaterial(@RequestParam("materialId") Long materialId, 
                       @RequestParam("moduleId") String moduleId, 
                       @RequestParam("fileUrl") String fileUrl);
}
