package com.lms.announcement.dto;

import com.lms.announcement.entity.TargetAudience;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementResponseDto {
    private Long id;
    private String title;
    private String description;
    private String type;
    private TargetAudience targetAudience;
    private String targetId;
    private LocalDateTime createdDate;
}

