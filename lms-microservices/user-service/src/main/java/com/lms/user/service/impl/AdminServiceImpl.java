package com.lms.user.service.impl;

import com.lms.user.dto.*;
import com.lms.user.entity.Address;
import com.lms.user.entity.AppUser;
import com.lms.user.entity.Lecturer;
import com.lms.user.entity.Student;
import com.lms.user.exception.NotFoundException;
import com.lms.user.repository.AddressRepository;
import com.lms.user.repository.AppUserRepository;
import com.lms.user.repository.LecturerRepository;
import com.lms.user.repository.StudentRepository;
import com.lms.user.service.AdminService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private LecturerRepository lecturerRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String createStudent(StudentRequestDto dto, String groupName) {
        if (studentRepository.findByUsername(dto.getUsername()) != null) {
            throw new RuntimeException("Student already exists with username " + dto.getUsername());
        }

        Address address = new Address();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            address = addressRepository.save(address);
            Student student = getStudent(dto, address);
            studentRepository.save(student);

            // Create corresponding AppUser for authentication
            if (appUserRepository.findByUsername(dto.getUsername()).isEmpty()) {
                AppUser appUser = new AppUser();
                appUser.setUsername(dto.getUsername());
                appUser.setEmail(dto.getEmail());
                appUser.setPassword(passwordEncoder.encode("password123")); // Default password
                appUser.setRole("ROLE_STUDENT");
                appUserRepository.save(appUser);
            }

            return "Student created successfully with username " + dto.getUsername();
        } catch (Exception e) {
            throw new RuntimeException("Failed to save student in database", e);
        }
    }

    public Student getStudentById(Long id) {
        return studentRepository.findById(id).orElse(null);
    }

    public Student getStudentByUsername(String username) {
        return studentRepository.findByUsername(username);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public List<Student> getStudentsByLevel(String level) {
        return studentRepository.findByIntakeIgnoreCase(level);
    }

    public String updateStudent(Long id, StudentUpdateDto dto) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            throw new NotFoundException("Student not found with id " + id);
        }

        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setFullName(dto.getFullName());
        student.setPhone(dto.getPhone());
        student.setDateOfBirth(dto.getDateOfBirth());
        student.setGender(dto.getGender());
        student.setCourseId(dto.getCourseId());
        student.setIntake(dto.getIntake());

        Address address = student.getAddress();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            addressRepository.save(address);
            studentRepository.save(student);
            return "Student updated successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to update student in database", e);
        }
    }

    public String deleteStudent(Long id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) {
            throw new NotFoundException("Student not found with id " + id);
        }

        try {
            studentRepository.delete(student);
            appUserRepository.findByUsername(student.getUsername()).ifPresent(appUserRepository::delete);
            return "Student deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete student in database", e);
        }
    }

    public String createLecturer(LecturerRequestDto dto, String groupName) {
        if (lecturerRepository.findByUsername(dto.getUsername()) != null) {
            throw new RuntimeException("Lecturer already exists with username " + dto.getUsername());
        }

        Address address = new Address();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            address = addressRepository.save(address);
            Lecturer lecturer = getLecturer(dto, address);
            lecturerRepository.save(lecturer);

            // Create corresponding AppUser for authentication
            if (appUserRepository.findByUsername(dto.getUsername()).isEmpty()) {
                AppUser appUser = new AppUser();
                appUser.setUsername(dto.getUsername());
                appUser.setEmail(dto.getEmail());
                appUser.setPassword(passwordEncoder.encode("password123")); // Default password
                appUser.setRole("ROLE_LECTURER");
                appUserRepository.save(appUser);
            }

            return "Lecturer created successfully with username " + dto.getUsername();
        } catch (Exception e) {
            throw new RuntimeException("Failed to save lecturer in database", e);
        }
    }

    public Lecturer getLecturerById(Long id) {
        return lecturerRepository.findById(id).orElse(null);
    }

    public Lecturer getLecturerByUsername(String username) {
        return lecturerRepository.findByUsername(username);
    }

    public List<Lecturer> getAllLecturers() {
        return lecturerRepository.findAll();
    }

    public String updateLecturer(Long id, LecturerUpdateDto dto) {
        Lecturer lecturer = lecturerRepository.findById(id).orElse(null);
        if (lecturer == null) {
            throw new NotFoundException("Lecturer not found with id " + id);
        }

        lecturer.setFirstName(dto.getFirstName());
        lecturer.setLastName(dto.getLastName());
        lecturer.setFullName(dto.getFullName());
        lecturer.setPhone(dto.getPhone());
        lecturer.setDateOfBirth(dto.getDateOfBirth());
        lecturer.setGender(dto.getGender());

        Address address = lecturer.getAddress();
        address.setAddressLine1(dto.getAddress().getAddressLine1());
        address.setAddressLine2(dto.getAddress().getAddressLine2());
        address.setCity(dto.getAddress().getCity());
        address.setState(dto.getAddress().getState());
        address.setCountry(dto.getAddress().getCountry());

        try {
            addressRepository.save(address);
            lecturerRepository.save(lecturer);
            return "Lecturer updated successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to update lecturer in database", e);
        }
    }

    public String deleteLecturer(Long id) {
        Lecturer lecturer = lecturerRepository.findById(id).orElse(null);
        if (lecturer == null) {
            throw new NotFoundException("Lecturer not found with id " + id);
        }

        try {
            lecturerRepository.delete(lecturer);
            appUserRepository.findByUsername(lecturer.getUsername()).ifPresent(appUserRepository::delete);
            return "Lecturer deleted successfully";
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete lecturer in database", e);
        }
    }

    public Map<String, String> getUserByUsername(String username) {
        Student student = getStudentByUsername(username);
        if (student != null) {
            return Map.of("email", student.getEmail(), "name", student.getFullName());
        }
        Lecturer lecturer = getLecturerByUsername(username);
        if (lecturer != null) {
            return Map.of("email", lecturer.getEmail(), "name", lecturer.getFullName());
        }
        throw new RuntimeException("User not found with username " + username);
    }

    public void updateStudentDepartment(String username, String department) {
        Student student = studentRepository.findByUsername(username);
        if (student == null) {
            throw new NotFoundException("Student not found with username: " + username);
        }
        student.setDepartment(department);
        studentRepository.save(student);
    }

    @Override
    public List<Map<String, String>> getAllContacts() {
        List<Map<String, String>> contacts = new ArrayList<>();
        
        // Add Admins
        appUserRepository.findAll().stream()
                .filter(u -> "ROLE_ADMIN".equals(u.getRole()))
                .forEach(u -> {
                    Map<String, String> contact = new HashMap<>();
                    contact.put("username", u.getUsername());
                    contact.put("displayName", "Admin: " + u.getUsername());
                    contact.put("role", "ADMIN");
                    contacts.add(contact);
                });

        // Add Lecturers
        lecturerRepository.findAll().forEach(l -> {
            Map<String, String> contact = new HashMap<>();
            contact.put("username", l.getUsername());
            String name = (l.getFirstName() != null ? l.getFirstName() : "") + " " + (l.getLastName() != null ? l.getLastName() : "");
            contact.put("displayName", name.trim().isEmpty() ? l.getUsername() : name + " (Prof)");
            contact.put("role", "LECTURER");
            contacts.add(contact);
        });

        // Add Students
        studentRepository.findAll().forEach(s -> {
            Map<String, String> contact = new HashMap<>();
            contact.put("username", s.getUsername());
            String name = (s.getFirstName() != null ? s.getFirstName() : "") + " " + (s.getLastName() != null ? s.getLastName() : "");
            contact.put("displayName", name.trim().isEmpty() ? s.getUsername() : name + " (Etudiant)");
            contact.put("role", "STUDENT");
            contacts.add(contact);
        });

        return contacts;
    }

    private static Student getStudent(StudentRequestDto dto, Address address) {
        Student student = new Student();
        student.setUsername(dto.getUsername());
        student.setEmail(dto.getEmail());
        student.setFirstName(dto.getFirstName());
        student.setLastName(dto.getLastName());
        student.setFullName(dto.getFullName());
        student.setPhone(dto.getPhone());
        student.setAddress(address);
        student.setDateOfBirth(dto.getDateOfBirth());
        student.setGender(dto.getGender());
        student.setNicImage(dto.getNicImage());
        student.setStudentImage(dto.getStudentImage());
        student.setBirthCertificateImage(dto.getBirthCertificateImage());
        student.setStudentId(dto.getStudentId());
        student.setEnrollmentNumber(dto.getEnrollmentNumber());
        student.setIntake(dto.getIntake());
        student.setDepartment(dto.getDepartment());
        student.setGuardianName(dto.getGuardianName());
        student.setGuardianPhone(dto.getGuardianPhone());
        student.setGuardianEmail(dto.getGuardianEmail());
        student.setGuardianRelationship(dto.getGuardianRelationship());
        // Map courseId manually since it's part of the DTO
        if (dto.getCourseId() != null) {
            student.setCourseId(dto.getCourseId());
        }
        return student;
    }

    private static Lecturer getLecturer(LecturerRequestDto dto, Address address) {
        Lecturer lecturer = new Lecturer();
        lecturer.setUsername(dto.getUsername());
        lecturer.setEmail(dto.getEmail());
        lecturer.setFirstName(dto.getFirstName());
        lecturer.setLastName(dto.getLastName());
        lecturer.setFullName(dto.getFullName());
        lecturer.setPhone(dto.getPhone());
        lecturer.setAddress(address);
        lecturer.setDateOfBirth(dto.getDateOfBirth());
        lecturer.setGender(dto.getGender());
        lecturer.setNicImage(dto.getNicImage());
        lecturer.setProfileImage(dto.getProfileImage());
        lecturer.setLecturerId(dto.getLecturerId());
        lecturer.setDesignation(dto.getDesignation());
        lecturer.setDepartment(dto.getDepartment());
        lecturer.setFaculty(dto.getFaculty());
        lecturer.setOfficeLocation(dto.getOfficeLocation());
        lecturer.setWorkType(dto.getWorkType());
        lecturer.setNic(dto.getNic());
        lecturer.setHighestDegree(dto.getHighestDegree());
        lecturer.setInstitution(dto.getInstitution());
        lecturer.setMajor(dto.getMajor());
        lecturer.setResearchInterest(dto.getResearchInterest());
        lecturer.setLinkedIn(dto.getLinkedIn());
        lecturer.setCv(dto.getCv());
        return lecturer;
    }
}
