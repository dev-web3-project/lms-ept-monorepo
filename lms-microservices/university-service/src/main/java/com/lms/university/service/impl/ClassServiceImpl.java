package com.lms.university.service.impl;

import com.lms.university.dto.ClassUpdateDto;
import com.lms.university.entity.Class;
import com.lms.university.entity.Department;
import com.lms.university.exception.ConflictException;
import com.lms.university.exception.NotFoundException;
import com.lms.university.repository.ClassRepository;
import com.lms.university.repository.DepartmentRepository;
import com.lms.university.service.ClassService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ClassServiceImpl implements ClassService {

    private final ClassRepository classRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    public List<Class> listClasses() {
        List<Class> classes = classRepository.findAll();
        if (classes.isEmpty()) {
            throw new NotFoundException("No classes found");
        }
        return classes;
    }

    @Override
    public Class getClassById(Long id) {
        Class classRef = classRepository.findById(id).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        return classRef;
    }

    @Override
    public Class createClass(Class classRef) {
        if (classRepository.existsByName(classRef.getName())) {
            throw new ConflictException("Class already exists");
        }
        return classRepository.save(classRef);
    }

    @Override
    public Class updateClass(Long id, ClassUpdateDto classUpdateDto) {
        Class classRef = classRepository.findById(id).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRef.setName(classUpdateDto.getName());
        classRef.setDescription(classUpdateDto.getDescription());
        return classRepository.save(classRef);
    }

    @Override
    public String deleteClass(Long id) {
        Class classRef = classRepository.findById(id).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRepository.delete(classRef);
        return "Class deleted successfully";
    }

    @Override
    public List<Class> getClassesByDepartmentId(Long departmentId) {
        List<Class> classes = classRepository.findByDepartmentId(departmentId);
        if (classes.isEmpty()) {
            throw new NotFoundException("No classes found");
        }
        return classes;
    }

    @Override
    public List<Class> listClassesWithoutDepartment() {
        List<Class> classes = classRepository.findByDepartmentIsNull();
        if (classes.isEmpty()) {
            throw new NotFoundException("No classes found");
        }
        return classes;
    }

    @Override
    public String assignClassToDepartment(Long departmentId, Long classId) {
        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department == null) {
            throw new NotFoundException("Department not found");
        }
        Class classRef = classRepository.findById(classId).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRef.setDepartment(department);
        classRepository.save(classRef);
        return "Class assigned to department successfully";
    }

    @Override
    public String unassignClassFromDepartment(Long classId) {
        Class classRef = classRepository.findById(classId).orElse(null);
        if (classRef == null) {
            throw new NotFoundException("Class not found");
        }
        classRef.setDepartment(null);
        classRepository.save(classRef);
        return "Class unassigned from department successfully";
    }
}
