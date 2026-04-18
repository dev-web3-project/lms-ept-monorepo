package com.lms.apigateway.security;

import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

@Component
public class RouteValidator {

    public static final List<String> openApiEndpoints = List.of(
            "/api/user/auth/login",
            "/api/user/auth/register",
            "/eureka",
            "/api-docs",
            "/v3/api-docs",
            "/swagger-ui",
            "/swagger-resources",
            "/api/public/", // Any endpoint under /api/public is open
            "/api/course/files/download/", // Downloads accessible without JWT
            "/api/user/contacts",
            "/api/ai/" // AI service endpoints accessible without JWT
    );

    public Predicate<ServerHttpRequest> isSecured =
            request -> openApiEndpoints
                    .stream()
                    .noneMatch(uri -> request.getURI().getPath().contains(uri));
}
