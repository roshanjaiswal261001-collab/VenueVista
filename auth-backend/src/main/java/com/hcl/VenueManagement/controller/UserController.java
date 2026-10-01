package com.hcl.VenueManagement.controller;

import com.hcl.VenueManagement.dto.LoginRequest;
import com.hcl.VenueManagement.dto.RegisterRequest;
import com.hcl.VenueManagement.dto.UserResponse;
import com.hcl.VenueManagement.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public UserResponse registerUser(
            @RequestBody RegisterRequest request) {

        return userService.registerUser(request);
    }

    @PostMapping("/login")
    public UserResponse loginUser(
            @RequestBody LoginRequest request) {

        return userService.loginUser(request);
    }
}