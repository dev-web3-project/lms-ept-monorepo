package com.lms.course.service.impl;

import com.lms.course.dto.CourseSessionDto;
import com.lms.course.dto.CourseUpdateDto;
import com.lms.course.dto.ModuleUpdateDto;
import com.lms.course.entity.CModule;
import com.lms.course.entity.Course;
import com.lms.course.entity.ForumThread;
import com.lms.course.entity.TeachingUnit;
import com.lms.course.exception.ConflictException;
import com.lms.course.exception.NotFoundException;
import com.lms.course.repository.CourseRepository;
import com.lms.course.repository.ModuleRepository;
import com.lms.course.repository.TeachingUnitRepository;
import com.lms.course.service.CourseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseServiceImpl implements CourseService {

    private CourseRepository courseRepository;
    private ModuleRepository moduleRepository;
    private TeachingUnitRepository teachingUnitRepository;
    private com.lms.course.repository.MaterialRepository materialRepository;
    private com.lms.course.repository.GradeRepository gradeRepository;
    private com.lms.course.repository.AssignmentRepository assignmentRepository;
    private com.lms.course.repository.SubmissionRepository submissionRepository;
    private com.lms.course.repository.AttendanceRepository attendanceRepository;
    private com.lms.course.repository.QuizRepository quizRepository;
    private com.lms.course.repository.QuizResultRepository quizResultRepository;
    private com.lms.course.repository.ForumThreadRepository forumThreadRepository;
    private com.lms.course.repository.ForumPostRepository forumPostRepository;
    private com.lms.course.repository.ForumUpvoteRepository forumUpvoteRepository;
    private com.lms.course.repository.ForumThreadViewRepository forumThreadViewRepository;
    private com.lms.course.client.AiClient aiClient;
    private com.lms.course.repository.LacuneRepository lacuneRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.web.client.RestTemplate restTemplate;

    public CourseServiceImpl(CourseRepository courseRepository, ModuleRepository moduleRepository,
                           TeachingUnitRepository teachingUnitRepository,
                           com.lms.course.repository.MaterialRepository materialRepository,
                           com.lms.course.repository.GradeRepository gradeRepository,
                           com.lms.course.repository.AssignmentRepository assignmentRepository,
                           com.lms.course.repository.SubmissionRepository submissionRepository,
                           com.lms.course.repository.AttendanceRepository attendanceRepository,
                           com.lms.course.repository.QuizRepository quizRepository,
                           com.lms.course.repository.QuizResultRepository quizResultRepository,
                           com.lms.course.repository.ForumThreadRepository forumThreadRepository,
                           com.lms.course.repository.ForumPostRepository forumPostRepository,
                           com.lms.course.repository.ForumUpvoteRepository forumUpvoteRepository,
                           com.lms.course.repository.ForumThreadViewRepository forumThreadViewRepository,
                           com.lms.course.client.AiClient aiClient,
                           com.lms.course.repository.LacuneRepository lacuneRepository) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.teachingUnitRepository = teachingUnitRepository;
        this.materialRepository = materialRepository;
        this.gradeRepository = gradeRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.attendanceRepository = attendanceRepository;
        this.quizRepository = quizRepository;
        this.quizResultRepository = quizResultRepository;
        this.forumThreadRepository = forumThreadRepository;
        this.forumPostRepository = forumPostRepository;
        this.forumUpvoteRepository = forumUpvoteRepository;
        this.forumThreadViewRepository = forumThreadViewRepository;
        this.aiClient = aiClient;
        this.lacuneRepository = lacuneRepository;
    }

    public Course createCourse(Course course) {
        // Pour les séances attachées à un module, le titre n'a pas besoin d'être unique globalement.
        // Le check d'unicité ne s'applique qu'aux cours autonomes (sans module).
        if (course.getModule() == null && courseRepository.existsByTitle(course.getTitle())) {
            throw new ConflictException("Course already exists");
        }
        return courseRepository.save(course);
    }

    public Course getCourseById(Long id) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) {
            throw new NotFoundException("Faculty not found");
        }
        return course;
    }

    public Course updateCourse(Long id, CourseUpdateDto courseUpdateDto) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found with id " + id);
        }
        course.setTitle(courseUpdateDto.getTitle());
        course.setDescription(courseUpdateDto.getDescription());
        course.setLecturer(courseUpdateDto.getLecturer());
        course.setDuration(courseUpdateDto.getDuration());
        course.setLevel(courseUpdateDto.getLevel());
        course.setLanguage(courseUpdateDto.getLanguage());
        course.setFormat(courseUpdateDto.getFormat());
        course.setCredits(courseUpdateDto.getCredits());

        return courseRepository.save(course);
    }

    public String deleteCourse(Long id) {
        Course course = courseRepository.findById(id).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        courseRepository.delete(course);
        return "Faculty deleted successfully";
    }

    public List<Course> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    // get all modules
    public List<CModule> getModules() {
        List<CModule> modules = moduleRepository.findAll();
        if (modules.isEmpty()) {
            throw new NotFoundException("No modules found");
        }
        return modules;
    }

    // Get Module by id
    public CModule getModuleById(Long id) {
        CModule module = moduleRepository.findById(id).orElse(null);
        if(module == null) {
            throw new NotFoundException("Module not found");
        }
        return module;
    }

    @Transactional
    public CModule createModule(CModule module) {
        // Validation: codeEC unique
        if(module.getCodeEC() != null && moduleRepository.existsByCodeEC(module.getCodeEC())) {
            throw new ConflictException("Module with code " + module.getCodeEC() + " already exists");
        }

        // Validation: TeachingUnit obligatoire
        if (module.getTeachingUnit() == null || module.getTeachingUnit().getId() == null) {
            throw new IllegalArgumentException("TeachingUnit is required. A module (EC) must belong to a TeachingUnit (UE).");
        }

        // Vérifier que l'UE existe
        TeachingUnit tu = teachingUnitRepository.findById(module.getTeachingUnit().getId())
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found with id: " + module.getTeachingUnit().getId()));

        module.setTeachingUnit(tu);

        return moduleRepository.save(module);
    }

    @Transactional
    public CModule updateModule(Long id, ModuleUpdateDto moduleUpdateDto) {
        CModule module = moduleRepository.findById(id).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found");
        }

        // Basic info
        if (moduleUpdateDto.getCodeEC() != null) {
            module.setCodeEC(moduleUpdateDto.getCodeEC());
        }
        if (moduleUpdateDto.getName() != null) {
            module.setName(moduleUpdateDto.getName());
        }
        if (moduleUpdateDto.getDescription() != null) {
            module.setDescription(moduleUpdateDto.getDescription());
        }

        // Charge horaire
        if (moduleUpdateDto.getCmHours() != null) {
            module.setCmHours(moduleUpdateDto.getCmHours());
        }
        if (moduleUpdateDto.getTdHours() != null) {
            module.setTdHours(moduleUpdateDto.getTdHours());
        }
        if (moduleUpdateDto.getTpHours() != null) {
            module.setTpHours(moduleUpdateDto.getTpHours());
        }
        if (moduleUpdateDto.getTpeHours() != null) {
            module.setTpeHours(moduleUpdateDto.getTpeHours());
        }

        // Crédits et classification
        if (moduleUpdateDto.getCreditsEC() != null) {
            module.setCreditsEC(moduleUpdateDto.getCreditsEC());
        }
        if (moduleUpdateDto.getSemester() != null) {
            module.setSemester(moduleUpdateDto.getSemester());
        }
        if (moduleUpdateDto.getLevel() != null) {
            module.setLevel(moduleUpdateDto.getLevel());
        }

        // Relations
        if (moduleUpdateDto.getTeachingUnitId() != null) {
            TeachingUnit tu = teachingUnitRepository.findById(moduleUpdateDto.getTeachingUnitId())
                    .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));
            module.setTeachingUnit(tu);
        }
        if (moduleUpdateDto.getLecturerUsername() != null) {
            module.setLecturerUsername(moduleUpdateDto.getLecturerUsername());
        }

        // Avancement
        if (moduleUpdateDto.getCompletedHours() != null) {
            module.setCompletedHours(moduleUpdateDto.getCompletedHours());
        }
        if (moduleUpdateDto.getIsValidated() != null) {
            module.setIsValidated(moduleUpdateDto.getIsValidated());
        }

        // Dates
        if (moduleUpdateDto.getStartDate() != null) {
            module.setStartDate(moduleUpdateDto.getStartDate());
        }
        if (moduleUpdateDto.getEndDate() != null) {
            module.setEndDate(moduleUpdateDto.getEndDate());
        }

        return moduleRepository.save(module);
    }

    public String deleteModule(Long id) {
        CModule module = moduleRepository.findById(id).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found");
        }
        moduleRepository.delete(module);
        return "Module deleted successfully";
    }

    // get all courses by module id
    public List<Course> getCoursesByModuleId(Long moduleId) {
        return courseRepository.findByModuleId(moduleId);
    }

    public List<CModule> getModulesByCourseId(Long courseId) {
        return getModulesByCourseId(courseId, null);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CModule> getModulesByCourseId(Long courseId, String level) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }

        // Strategy: If course has a department, return all modules of all courses in that department
        // IF a level is provided, filter those modules by level
        if (course.getDepartmentId() != null) {
            List<Course> deptCourses = courseRepository.findByDepartmentId(course.getDepartmentId());
            return deptCourses.stream()
                    .filter(c -> level == null || (c.getLevel() != null && c.getLevel().equalsIgnoreCase(level)))
                    .map(Course::getModule)
                    .filter(java.util.Objects::nonNull)
                    .filter(m -> level == null || (m.getLevel() != null && m.getLevel().equalsIgnoreCase(level)))
                    .distinct()
                    .collect(java.util.stream.Collectors.toList());
        }

        // Fallback: return only the module of this course
        if (course.getModule() != null) {
            CModule m = course.getModule();
            if (level == null || (m.getLevel() != null && m.getLevel().equalsIgnoreCase(level))) {
                return java.util.List.of(m);
            }
        }

        return java.util.Collections.emptyList();
    }

    public List<CModule> getModulesByLecturer(String lecturerUsername) {
        return moduleRepository.findByLecturerUsername(lecturerUsername);
    }

    public List<CModule> getModulesByStudent(String username) {
        // Get student details to find their level
        // Route: GET /api/user/student/{username}/username
        String studentUrl = "http://user-service/api/user/student/" + username + "/username";
        java.util.Map<String, Object> student = null;
        try {
            student = restTemplate.getForObject(studentUrl, java.util.Map.class);
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }

        if (student == null || student.get("intake") == null) {
            return java.util.Collections.emptyList();
        }

        // Get modules by student's level (intake)
        String level = student.get("intake").toString();
        return moduleRepository.findByLevelIgnoreCase(level);
    }

    public List<java.util.Map<String, Object>> getStudentsByModule(Long moduleId) {
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) {
            return java.util.Collections.emptyList();
        }

        // Get students by module's level
        String level = module.getLevel();
        if (level == null) {
            return java.util.Collections.emptyList();
        }

        String studentsUrl = "http://user-service/api/user/student/level/" + level;
        try {
            java.util.List<java.util.Map<String, Object>> students = restTemplate.getForObject(
                studentsUrl,
                java.util.List.class
            );
            if (students == null) {
                return java.util.Collections.emptyList();
            }
            return students.stream()
                .map(s -> {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("username", s.get("username"));
                    map.put("firstName", s.get("firstName"));
                    map.put("lastName", s.get("lastName"));
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    public List<CModule> getModulesByTeachingUnit(Long teachingUnitId) {
        return moduleRepository.findByTeachingUnitId(teachingUnitId);
    }

    public List<CModule> getModulesBySemester(String semester) {
        return moduleRepository.findBySemester(semester);
    }

    public List<CModule> getModulesByLevel(String level) {
        return moduleRepository.findByLevelIgnoreCase(level);
    }

    public List<CModule> getModulesBySemesterAndLevel(String semester, String level) {
        return moduleRepository.findBySemesterAndLevel(semester, level);
    }

    public CModule getModuleByCodeEC(String codeEC) {
        return moduleRepository.findByCodeEC(codeEC)
                .orElseThrow(() -> new NotFoundException("Module with code " + codeEC + " not found"));
    }

    // ======================== TEACHING UNIT (UE) ========================

    @Transactional
    public TeachingUnit createTeachingUnit(TeachingUnit teachingUnit) {
        if (teachingUnitRepository.existsByCode(teachingUnit.getCode())) {
            throw new ConflictException("TeachingUnit with code " + teachingUnit.getCode() + " already exists");
        }
        return teachingUnitRepository.save(teachingUnit);
    }

    public TeachingUnit getTeachingUnitById(Long id) {
        return teachingUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));
    }

    public TeachingUnit getTeachingUnitByCode(String code) {
        return teachingUnitRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("TeachingUnit with code " + code + " not found"));
    }

    public List<TeachingUnit> getAllTeachingUnits() {
        List<TeachingUnit> units = teachingUnitRepository.findAll();
        if (units.isEmpty()) {
            throw new NotFoundException("No TeachingUnits found");
        }
        return units;
    }

    public List<TeachingUnit> getTeachingUnitsBySemester(String semester) {
        return teachingUnitRepository.findBySemester(semester);
    }

    public List<TeachingUnit> getTeachingUnitsByClassId(Long classId) {
        return teachingUnitRepository.findByClassId(classId);
    }

    @Transactional
    public TeachingUnit updateTeachingUnit(Long id, TeachingUnit teachingUnit) {
        TeachingUnit existing = teachingUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));

        if (teachingUnit.getName() != null) {
            existing.setName(teachingUnit.getName());
        }
        if (teachingUnit.getCode() != null) {
            existing.setCode(teachingUnit.getCode());
        }
        if (teachingUnit.getDescription() != null) {
            existing.setDescription(teachingUnit.getDescription());
        }
        if (teachingUnit.getSemester() != null) {
            existing.setSemester(teachingUnit.getSemester());
        }
        if (teachingUnit.getCreditsUE() != null) {
            existing.setCreditsUE(teachingUnit.getCreditsUE());
        }
        if (teachingUnit.getDepartmentId() != null) {
            existing.setDepartmentId(teachingUnit.getDepartmentId());
        }
        if (teachingUnit.getClassId() != null) {
            existing.setClassId(teachingUnit.getClassId());
        }

        return teachingUnitRepository.save(existing);
    }

    @Transactional
    public String deleteTeachingUnit(Long id) {
        TeachingUnit unit = teachingUnitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("TeachingUnit not found"));
        teachingUnitRepository.delete(unit);
        return "TeachingUnit deleted successfully";
    }

    // assign course to module
    public String assignCourseToModule(Long courseId, Long moduleId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found");
        }
        course.setModule(module);
        courseRepository.save(course);
        return "Course assigned to module successfully";
    }

    // list courses without assigned to module
    public List<Course> getCoursesWithoutAssignedToModule() {
        List<Course> courses = courseRepository.findByModuleIsNull();
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    // Unassign course from module
    public String unassignCourseFromModule(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        course.setModule(null);
        courseRepository.save(course);
        return "Course unassigned from module successfully";
    }

    public List<Course> getCoursesWithoutAssigned() {
        List<Course> courses = courseRepository.findByDepartmentIdIsNull();
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    public List<Course> getCoursesByDepartmentId(Long departmentId) {
        List<Course> courses = courseRepository.findByDepartmentId(departmentId);
        if (courses.isEmpty()) {
            throw new NotFoundException("No courses found");
        }
        return courses;
    }

    public String unassignCourseFromDepartment(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        course.setDepartmentId(null);
        courseRepository.save(course);
        return "Course unassigned from department successfully";
    }

    public String getCourseNameById(Long courseId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            throw new NotFoundException("Course not found");
        }
        return course.getTitle();
    }

    // ======================== COURSE SESSION (SÉANCE) ========================

    @Transactional
    public Course createCourseSession(Long moduleId, CourseSessionDto sessionDto, String lecturerUsername) {
        // Vérifier que le module existe
        CModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new NotFoundException("Module not found with id: " + moduleId));

        // Sécurité: vérifier que l'utilisateur est le prof du module
        if (!module.getLecturerUsername().equals(lecturerUsername)) {
            throw new SecurityException("You are not authorized to create sessions for this module");
        }

        // Créer la séance
        Course session = new Course();
        session.setModule(module);
        session.setSessionDate(sessionDto.getSessionDate());
        session.setOrdre(sessionDto.getOrdre());
        session.setDuree(sessionDto.getDuree());
        session.setTypeSeance(sessionDto.getTypeSeance());
        session.setObjectifs(sessionDto.getObjectifs());
        session.setContenu(sessionDto.getContenu());

        return courseRepository.save(session);
    }

    @Transactional
    public Course updateCourseSession(Long sessionId, CourseSessionDto sessionDto, String lecturerUsername) {
        Course session = courseRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Course session not found with id: " + sessionId));

        // Sécurité: vérifier que l'utilisateur est le prof du module
        if (session.getModule() == null || !session.getModule().getLecturerUsername().equals(lecturerUsername)) {
            throw new SecurityException("You are not authorized to update this session");
        }

        // Mettre à jour les champs fournis
        if (sessionDto.getSessionDate() != null) {
            session.setSessionDate(sessionDto.getSessionDate());
        }
        if (sessionDto.getOrdre() != null) {
            session.setOrdre(sessionDto.getOrdre());
        }
        if (sessionDto.getDuree() != null) {
            session.setDuree(sessionDto.getDuree());
        }
        if (sessionDto.getTypeSeance() != null) {
            session.setTypeSeance(sessionDto.getTypeSeance());
        }
        if (sessionDto.getObjectifs() != null) {
            session.setObjectifs(sessionDto.getObjectifs());
        }
        if (sessionDto.getContenu() != null) {
            session.setContenu(sessionDto.getContenu());
        }

        return courseRepository.save(session);
    }

    public Course getCourseSessionById(Long sessionId) {
        return courseRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Course session not found with id: " + sessionId));
    }

    public List<Course> getCourseSessionsByModuleId(Long moduleId) {
        return courseRepository.findByModuleIdOrderByOrdreAsc(moduleId);
    }

    @Transactional
    public String deleteCourseSession(Long sessionId, String lecturerUsername) {
        Course session = courseRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Course session not found with id: " + sessionId));

        // Sécurité: vérifier que l'utilisateur est le prof du module
        if (session.getModule() == null || !session.getModule().getLecturerUsername().equals(lecturerUsername)) {
            throw new SecurityException("You are not authorized to delete this session");
        }

        courseRepository.delete(session);
        return "Course session deleted successfully";
    }

    // ======================== MATERIALS ========================

    public List<com.lms.course.entity.Material> getMaterialsByCourseId(Long courseId) {
        return materialRepository.findByCourseId(courseId);
    }

    public List<com.lms.course.entity.Material> getMaterialsByModuleId(Long moduleId) {
        return materialRepository.findByModuleId(moduleId);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.entity.Material createMaterial(com.lms.course.dto.MaterialRequestDto dto) {
        Course course = null;
        CModule module = null;
        if (dto.getCourseId() != null) {
            course = courseRepository.findById(dto.getCourseId())
                    .orElseThrow(() -> new NotFoundException("Course not found with id: " + dto.getCourseId()));
            module = course.getModule();
        }
        if (module == null && dto.getModuleId() != null) {
            module = moduleRepository.findById(dto.getModuleId())
                    .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));
        }
        if (module == null) {
            throw new NotFoundException("Either courseId or moduleId must be provided");
        }

        com.lms.course.entity.Material material = new com.lms.course.entity.Material();
        material.setTitle(dto.getTitle());
        material.setDescription(dto.getDescription());
        material.setType(dto.getType());
        material.setFileUrl(dto.getFileUrl());
        material.setModule(module);
        material.setCourse(course);
        com.lms.course.entity.Material savedMaterial = materialRepository.save(material);

        // Auto-index if it's a PDF or TXT
        String type = savedMaterial.getType();
        if (("PDF".equalsIgnoreCase(type) || "TXT".equalsIgnoreCase(type) || "TEXT".equalsIgnoreCase(type))
            && savedMaterial.getFileUrl() != null) {
            try {
                aiClient.indexMaterial(savedMaterial.getId(),
                                     savedMaterial.getModule().getId().toString(),
                                     savedMaterial.getFileUrl());
            } catch (Exception e) {
                // Log error but don't fail material creation
            }
        }

        return savedMaterial;
    }

    public String deleteMaterial(Long id) {
        com.lms.course.entity.Material material = materialRepository.findById(id).orElse(null);
        if (material == null) {
            throw new NotFoundException("Material not found");
        }
        materialRepository.delete(material);
        return "Material deleted successfully";
    }

    public List<com.lms.course.dto.GradeResponseDto> getGradesByStudentId(Long studentId) {
        return gradeRepository.findByStudentId(studentId).stream()
                .map(com.lms.course.dto.GradeResponseDto::fromEntity).toList();
    }

    public List<com.lms.course.dto.GradeResponseDto> getGradesByModuleId(Long moduleId) {
        return gradeRepository.findByModuleId(moduleId).stream()
                .map(com.lms.course.dto.GradeResponseDto::fromEntity).toList();
    }

    public com.lms.course.dto.GradeResponseDto saveGrade(com.lms.course.dto.GradeRequestDto dto) {
        CModule module = moduleRepository.findById(dto.getModuleId()).orElse(null);
        if (module == null) {
            throw new NotFoundException("Module not found with id: " + dto.getModuleId());
        }

        // Check if grade already exists for this student and module (update instead of duplicate)
        com.lms.course.entity.Grade existing = gradeRepository.findByStudentIdAndModuleId(dto.getStudentId(), dto.getModuleId());
        if (existing != null) {
            existing.setScore(dto.getScore());
            existing.setComments(dto.getComments());
            // Auto-calculate letter grade
            existing.setGrade(calculateLetterGrade(dto.getScore()));
            return com.lms.course.dto.GradeResponseDto.fromEntity(gradeRepository.save(existing));
        }

        com.lms.course.entity.Grade grade = new com.lms.course.entity.Grade();
        grade.setStudentId(dto.getStudentId());
        grade.setModule(module);
        grade.setScore(dto.getScore());
        grade.setComments(dto.getComments());
        grade.setGrade(calculateLetterGrade(dto.getScore()));
        return com.lms.course.dto.GradeResponseDto.fromEntity(gradeRepository.save(grade));
    }

    private String calculateLetterGrade(Double score) {
        if (score == null) return null;
        if (score >= 16) return "A";
        if (score >= 14) return "B+";
        if (score >= 12) return "B";
        if (score >= 10) return "C";
        if (score >= 8) return "D";
        return "F";
    }

    public List<com.lms.course.entity.Assignment> getAssignmentsByModuleId(Long moduleId) {
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) throw new NotFoundException("Module not found");
        return assignmentRepository.findByModule(module);
    }

    public com.lms.course.entity.Assignment createAssignment(com.lms.course.entity.Assignment assignment) {
        return assignmentRepository.save(assignment);
    }

    public String deleteAssignment(Long id) {
        assignmentRepository.deleteById(id);
        return "Assignment deleted successfully";
    }

    public List<com.lms.course.entity.Submission> getSubmissionsByAssignmentId(Long assignmentId) {
        com.lms.course.entity.Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
        if (assignment == null) throw new NotFoundException("Assignment not found");
        return submissionRepository.findByAssignment(assignment);
    }

    public com.lms.course.entity.Submission submitAssignment(com.lms.course.entity.Submission submission) {
        return submissionRepository.save(submission);
    }

    public List<com.lms.course.entity.Submission> getSubmissionsByStudentId(String studentId) {
        return submissionRepository.findByStudentId(studentId);
    }

    public List<com.lms.course.entity.Attendance> getAttendanceByModuleAndDate(Long moduleId, java.time.LocalDate date) {
        CModule module = moduleRepository.findById(moduleId).orElse(null);
        if (module == null) throw new NotFoundException("Module not found");
        return attendanceRepository.findByModuleAndDate(module, date);
    }

    public com.lms.course.entity.Attendance saveAttendance(com.lms.course.entity.Attendance attendance) {
        return attendanceRepository.save(attendance);
    }

    public List<com.lms.course.entity.Attendance> getAttendanceByStudentId(String studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<com.lms.course.dto.QuizResponseDto> getQuizzesByModuleId(Long moduleId) {
        return quizRepository.findByModuleId(moduleId).stream()
                .map(com.lms.course.dto.QuizResponseDto::fromEntity).toList();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.lms.course.dto.QuizDetailDto getQuizById(Long id) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));
        return com.lms.course.dto.QuizDetailDto.fromEntity(quiz, false);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.lms.course.dto.QuizDetailDto getQuizForStudent(Long id) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));
        return com.lms.course.dto.QuizDetailDto.fromEntity(quiz, true);
    }

    public List<com.lms.course.entity.QuizResult> getQuizResultsByStudentId(String studentId) {
        return quizResultRepository.findByStudentId(studentId);
    }

    public com.lms.course.dto.QuizResponseDto createQuizFromDto(com.lms.course.dto.QuizCreateDto dto) {
        CModule module = moduleRepository.findById(dto.getModuleId())
                .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));

        if (quizRepository.existsByTitleAndModuleId(dto.getTitle(), dto.getModuleId())) {
            throw new RuntimeException("A quiz with the same title already exists in this module");
        }

        com.lms.course.entity.Quiz quiz = new com.lms.course.entity.Quiz();
        applyQuizFields(quiz, dto);
        quiz.setModule(module);
        buildQuestions(quiz, dto.getQuestions());

        return com.lms.course.dto.QuizResponseDto.fromEntity(quizRepository.save(quiz));
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.QuizResponseDto updateQuiz(Long id, com.lms.course.dto.QuizCreateDto dto) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));

        applyQuizFields(quiz, dto);

        // Replace questions only if provided AND no submissions exist
        if (dto.getQuestions() != null) {
            boolean hasResults = !quizResultRepository.findByQuiz(quiz).isEmpty();
            if (hasResults) {
                throw new ConflictException("Cannot update questions: quiz already has student submissions. Only metadata can be updated.");
            }
            if (quiz.getQuestions() != null) {
                quiz.getQuestions().clear();
            }
            buildQuestions(quiz, dto.getQuestions());
        }

        return com.lms.course.dto.QuizResponseDto.fromEntity(quizRepository.save(quiz));
    }

    @jakarta.transaction.Transactional
    public String deleteQuiz(Long id) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Quiz not found with id: " + id));
        // Delete results first (student_answers reference question_options via FK)
        List<com.lms.course.entity.QuizResult> results = quizResultRepository.findByQuiz(quiz);
        if (!results.isEmpty()) {
            quizResultRepository.deleteAll(results);
            quizResultRepository.flush();
        }
        quizRepository.delete(quiz);
        return "Quiz deleted successfully";
    }

    private void applyQuizFields(com.lms.course.entity.Quiz quiz, com.lms.course.dto.QuizCreateDto dto) {
        if (dto.getTitle() != null) quiz.setTitle(dto.getTitle());
        if (dto.getDescription() != null) quiz.setDescription(dto.getDescription());
        if (dto.getTimeLimit() != null) quiz.setTimeLimit(dto.getTimeLimit());
        if (dto.getTimeLimitPerQuestion() != null) quiz.setTimeLimitPerQuestion(dto.getTimeLimitPerQuestion());
        if (dto.getTypeQuiz() != null) quiz.setTypeQuiz(dto.getTypeQuiz());
        if (dto.getDocumentMode() != null) quiz.setDocumentMode(dto.getDocumentMode());
        if (dto.getCameraSurveillanceEnabled() != null) quiz.setCameraSurveillanceEnabled(dto.getCameraSurveillanceEnabled());
        if (dto.getRandomizeQuestions() != null) quiz.setRandomizeQuestions(dto.getRandomizeQuestions());
        if (dto.getRandomizeAnswers() != null) quiz.setRandomizeAnswers(dto.getRandomizeAnswers());
        if (dto.getMaxAttempts() != null) quiz.setMaxAttempts(dto.getMaxAttempts());
        if (dto.getPublishDate() != null) quiz.setPublishDate(dto.getPublishDate());
        if (dto.getDueDate() != null) quiz.setDueDate(dto.getDueDate());
        if (dto.getIsDraft() != null) quiz.setIsDraft(dto.getIsDraft());
        if (dto.getPassingScore() != null) quiz.setPassingScore(dto.getPassingScore());
    }

    private void buildQuestions(com.lms.course.entity.Quiz quiz, List<com.lms.course.dto.QuestionCreateDto> questionDtos) {
        if (questionDtos == null) return;
        List<com.lms.course.entity.Question> questions = questionDtos.stream().map(qDto -> {
            com.lms.course.entity.Question question = new com.lms.course.entity.Question();
            question.setText(qDto.getText());
            question.setHint(qDto.getHint());
            question.setJustification(qDto.getJustification());
            question.setOrderIndex(qDto.getOrderIndex());
            question.setPoints(qDto.getPoints());
            question.setType(qDto.getType());
            question.setCompetence(qDto.getCompetence());
            question.setQuiz(quiz);

            if (qDto.getOptions() != null) {
                List<com.lms.course.entity.QuestionOption> options = qDto.getOptions().stream().map(oDto -> {
                    com.lms.course.entity.QuestionOption option = new com.lms.course.entity.QuestionOption();
                    option.setText(oDto.getText());
                    option.setCorrect(oDto.getCorrect());
                    option.setQuestion(question);
                    return option;
                }).collect(java.util.stream.Collectors.toList());
                question.setOptions(options);
            }
            return question;
        }).collect(java.util.stream.Collectors.toList());

        if (quiz.getQuestions() == null) {
            quiz.setQuestions(questions);
        } else {
            quiz.getQuestions().addAll(questions);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.entity.QuizResult submitQuiz(com.lms.course.dto.QuizSubmissionDto dto) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(dto.getQuizId())
                .orElseThrow(() -> new NotFoundException("Quiz not found"));

        // Check max attempts (informative only now, or handled by logic)
        long attemptCount = quizResultRepository.countByQuizAndStudentId(quiz, dto.getStudentId());

        com.lms.course.entity.QuizResult result = new com.lms.course.entity.QuizResult();
        result.setQuiz(quiz);
        result.setStudentId(dto.getStudentId());
        result.setAttemptNumber((int) (attemptCount + 1));
        result.setCompletedDate(java.time.LocalDateTime.now());

        // Process answers and calculate score
        int totalPoints = 0;
        int earnedPoints = 0;

        List<com.lms.course.entity.StudentAnswer> studentAnswers = new java.util.ArrayList<>();
        for (com.lms.course.dto.StudentAnswerDto answerDto : dto.getAnswers()) {
            com.lms.course.entity.Question question = quiz.getQuestions().stream()
                    .filter(q -> q.getId().equals(answerDto.getQuestionId()))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("Question not found"));

            com.lms.course.entity.StudentAnswer studentAnswer = new com.lms.course.entity.StudentAnswer();
            studentAnswer.setQuizResult(result);
            studentAnswer.setQuestion(question);
            studentAnswer.setTextAnswer(answerDto.getTextAnswer());

            if (answerDto.getSelectedOptionId() != null) {
                com.lms.course.entity.QuestionOption selectedOption = question.getOptions().stream()
                        .filter(o -> o.getId().equals(answerDto.getSelectedOptionId()))
                        .findFirst()
                        .orElse(null);
                studentAnswer.setSelectedOption(selectedOption);
                studentAnswer.setIsCorrect(selectedOption != null && selectedOption.isCorrect());
            }

            studentAnswers.add(studentAnswer);

            if (question.getPoints() != null) {
                totalPoints += question.getPoints();
                if (Boolean.TRUE.equals(studentAnswer.getIsCorrect())) {
                    earnedPoints += question.getPoints();
                }
            }
        }

        result.setAnswers(studentAnswers);

        // Calculate score percentage
        if (totalPoints > 0) {
            double score = (double) earnedPoints / totalPoints * 100;
            result.setScore(score);
            // Convert passingScore from /20 to percentage if it's <= 20 (assuming /20 scale)
            Double passingThreshold = quiz.getPassingScore();
            if (passingThreshold != null && passingThreshold <= 20) {
                passingThreshold = passingThreshold * 5; // Convert /20 to /100
            }
            result.setPassed(passingThreshold != null && score >= passingThreshold);

            // Add Gamification XP
            try {
                if (result.getPassed() != null && result.getPassed()) {
                    restTemplate.postForObject("http://user-service/api/user/gamification/" + dto.getStudentId() + "/xp?amount=50", null, String.class);
                } else {
                    restTemplate.postForObject("http://user-service/api/user/gamification/" + dto.getStudentId() + "/xp?amount=10", null, String.class);
                }
            } catch (Exception e) {
                System.err.println("Failed to award XP: " + e.getMessage());
            }

            // Send notification
            try {
                java.util.Map<String, Object> notif = new java.util.HashMap<>();
                notif.put("userId", dto.getStudentId());
                boolean passed = Boolean.TRUE.equals(result.getPassed());
                notif.put("title", passed ? "Quiz réussi : " + quiz.getTitle() : "Quiz terminé : " + quiz.getTitle());
                notif.put("content", String.format("Score : %.1f%% %s", result.getScore(), passed ? "— Bravo !" : "— Continuez vos efforts."));
                notif.put("type", "QUIZ");
                restTemplate.postForObject("http://announcement-service/api/announcement/notifications/send", notif, Object.class);
            } catch (Exception e) {
                System.err.println("Failed to send quiz notification: " + e.getMessage());
            }
        } else {
            result.setScore(0.0);
            result.setPassed(false);
        }

        // Handle integrity report
        if (dto.getIntegrityReport() != null) {
            com.lms.course.entity.IntegrityReport integrityReport = new com.lms.course.entity.IntegrityReport();
            integrityReport.setQuizResult(result);
            integrityReport.setMouseExitCount(dto.getIntegrityReport().getMouseExitCount());
            integrityReport.setTabSwitchCount(dto.getIntegrityReport().getTabSwitchCount());
            integrityReport.setAutoSubmitted(dto.getIntegrityReport().getAutoSubmitted());
            integrityReport.setSuspiciousVideoSegments(dto.getIntegrityReport().getSuspiciousVideoSegments());
            integrityReport.setNotes(dto.getIntegrityReport().getNotes());

            // Calculate integrity score (simple formula)
            int integrityScore = 100;
            if (dto.getIntegrityReport().getMouseExitCount() != null) {
                integrityScore -= dto.getIntegrityReport().getMouseExitCount() * 5;
            }
            if (dto.getIntegrityReport().getTabSwitchCount() != null) {
                integrityScore -= dto.getIntegrityReport().getTabSwitchCount() * 10;
            }
            if (Boolean.TRUE.equals(dto.getIntegrityReport().getAutoSubmitted())) {
                integrityScore -= 30;
            }
            integrityReport.setIntegrityScore(Math.max(0, integrityScore));

            result.setIntegrityReport(integrityReport);
        }

        // ═══════════════════════════════════════════════════════════
        // DÉTECTION AUTOMATIQUE DES LACUNES (si quiz raté)
        // ═══════════════════════════════════════════════════════════
        try {
            Double passingThresholdForLacune = quiz.getPassingScore();
            if (passingThresholdForLacune != null && passingThresholdForLacune <= 20) {
                passingThresholdForLacune = passingThresholdForLacune * 5;
            }
            boolean quizFailed = passingThresholdForLacune == null ||
                result.getScore() == null ||
                result.getScore() < passingThresholdForLacune;

            if (quizFailed) {
                // Compter les erreurs par compétence
                java.util.Map<String, Integer> wrongByCompetence = new java.util.HashMap<>();
                java.util.Map<String, Integer> totalByCompetence = new java.util.HashMap<>();

                for (com.lms.course.entity.Question q : quiz.getQuestions()) {
                    if (q.getCompetence() != null && !q.getCompetence().isBlank()) {
                        totalByCompetence.merge(q.getCompetence(), 1, Integer::sum);
                    }
                }
                for (com.lms.course.entity.StudentAnswer sa : studentAnswers) {
                    if (Boolean.FALSE.equals(sa.getIsCorrect())) {
                        String comp = sa.getQuestion().getCompetence();
                        if (comp != null && !comp.isBlank()) {
                            wrongByCompetence.merge(comp, 1, Integer::sum);
                        }
                    }
                }

                Long moduleId = quiz.getModule() != null ? quiz.getModule().getId() : null;

                for (java.util.Map.Entry<String, Integer> entry : wrongByCompetence.entrySet()) {
                    String competence = entry.getKey();
                    int wrong = entry.getValue();
                    int total = totalByCompetence.getOrDefault(competence, 1);
                    double errorRate = (double) wrong / total;
                    String niveau = errorRate >= 0.7 ? "FAIBLE" : "MOYEN";

                    // Mettre à jour si déjà existant, sinon créer
                    List<com.lms.course.entity.Lacune> existing =
                        moduleId != null ?
                        lacuneRepository.findByStudentIdAndModuleId(dto.getStudentId(), moduleId) :
                        lacuneRepository.findByStudentId(dto.getStudentId());

                    boolean alreadyExists = existing.stream()
                        .anyMatch(l -> competence.equals(l.getCompetence()));

                    if (!alreadyExists) {
                        com.lms.course.entity.Lacune lacune = new com.lms.course.entity.Lacune();
                        lacune.setStudentId(dto.getStudentId());
                        lacune.setModuleId(moduleId);
                        lacune.setCompetence(competence);
                        lacune.setNiveau(niveau);
                        lacuneRepository.save(lacune);
                    }
                }

                // ═══════════════════════════════════════════════════════════
                // MISE À JOUR DU PROFIL ADAPTATIF + RECOMMANDATIONS (user-service)
                // ═══════════════════════════════════════════════════════════
                try {
                    java.util.List<com.lms.course.entity.Lacune> allLacunes = moduleId != null
                        ? lacuneRepository.findByStudentIdAndModuleId(dto.getStudentId(), moduleId)
                        : lacuneRepository.findByStudentId(dto.getStudentId());

                    if (!allLacunes.isEmpty()) {
                        // Construire la map compétence → niveau
                        java.util.Map<String, String> competencesMap = new java.util.LinkedHashMap<>();
                        for (com.lms.course.entity.Lacune l : allLacunes) {
                            if (l.getCompetence() != null) {
                                competencesMap.put(l.getCompetence(), l.getNiveau());
                            }
                        }
                        long faibleCount = competencesMap.values().stream()
                            .filter("FAIBLE"::equals).count();
                        String niveauGlobal = faibleCount >= 2 ? "DEBUTANT" : "INTERMEDIAIRE";

                        // Mettre à jour l'AdaptiveProfile dans user-service
                        java.util.Map<String, Object> adaptiveData = new java.util.HashMap<>();
                        adaptiveData.put("competences", competencesMap);
                        adaptiveData.put("niveauGlobal", niveauGlobal);
                        restTemplate.postForObject(
                            "http://user-service/api/user/analytics/student/" + dto.getStudentId() + "/profil-adaptatif",
                            adaptiveData, Object.class);

                        // Créer une Recommendation par lacune nouvelle
                        String moduleName = quiz.getModule() != null && quiz.getModule().getName() != null
                            ? quiz.getModule().getName() : "ce module";
                        for (java.util.Map.Entry<String, Integer> e2 : wrongByCompetence.entrySet()) {
                            String comp2 = e2.getKey();
                            String niv2 = competencesMap.getOrDefault(comp2, "MOYEN");
                            java.util.Map<String, Object> reco = new java.util.HashMap<>();
                            reco.put("typeReco", "MODULE");
                            reco.put("cibleId", moduleId != null ? String.valueOf(moduleId) : "0");
                            reco.put("raison", "Lacune " + niv2 + " en \"" + comp2
                                + "\" \u2014 quiz : \"" + quiz.getTitle()
                                + "\". Révisez les supports du module : " + moduleName + ".");
                            try {
                                restTemplate.postForObject(
                                    "http://user-service/api/user/analytics/student/" + dto.getStudentId() + "/recommandations",
                                    reco, Object.class);
                            } catch (Exception recoEx) {
                                System.err.println("Failed to create recommendation: " + recoEx.getMessage());
                            }
                        }
                    }
                } catch (Exception adaptiveEx) {
                    System.err.println("Failed to update adaptive profile: " + adaptiveEx.getMessage());
                }
            }
        } catch (Exception lacuneEx) {
            System.err.println("Failed to create lacunes: " + lacuneEx.getMessage());
        }

        return quizResultRepository.save(result);
    }

    public List<com.lms.course.entity.QuizResult> getQuizResultsByQuizId(Long quizId) {
        com.lms.course.entity.Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new NotFoundException("Quiz not found"));
        return quizResultRepository.findByQuiz(quiz);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.QuizResultDetailDto submitQuizWithDetails(com.lms.course.dto.QuizSubmissionDto dto) {
        com.lms.course.entity.QuizResult result = submitQuiz(dto);
        return buildQuizResultDetail(result);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.lms.course.dto.QuizResultDetailDto getQuizResultDetails(Long resultId) {
        com.lms.course.entity.QuizResult result = quizResultRepository.findById(resultId)
                .orElseThrow(() -> new NotFoundException("Quiz result not found"));
        return buildQuizResultDetail(result);
    }

    private com.lms.course.dto.QuizResultDetailDto buildQuizResultDetail(com.lms.course.entity.QuizResult result) {
        com.lms.course.entity.Quiz quiz = result.getQuiz();
        com.lms.course.dto.QuizResultDetailDto dto = new com.lms.course.dto.QuizResultDetailDto();
        dto.setId(result.getId());
        dto.setQuizId(quiz.getId());
        dto.setQuizTitle(quiz.getTitle());
        dto.setStudentId(result.getStudentId());
        dto.setScore(result.getScore() != null ? result.getScore() : 0.0);
        if (result.getScore() != null) {
            dto.setScoreOnTwenty(Math.round((result.getScore() / 100.0 * 20.0) * 100.0) / 100.0);
        } else {
            dto.setScoreOnTwenty(0.0);
        }
        dto.setPassed(result.getPassed());
        dto.setPassingScore(quiz.getPassingScore());
        dto.setAttemptNumber(result.getAttemptNumber());
        dto.setMaxAttempts(quiz.getMaxAttempts());
        dto.setCompletedDate(result.getCompletedDate());

        // Map student answers by question id for quick lookup
        java.util.Map<Long, com.lms.course.entity.StudentAnswer> answerByQ = new java.util.HashMap<>();
        if (result.getAnswers() != null) {
            for (com.lms.course.entity.StudentAnswer sa : result.getAnswers()) {
                if (sa.getQuestion() != null) {
                    answerByQ.put(sa.getQuestion().getId(), sa);
                }
            }
        }

        java.util.List<com.lms.course.dto.QuizResultDetailDto.QuestionResultDto> qDtos = new java.util.ArrayList<>();
        if (quiz.getQuestions() != null) {
            for (com.lms.course.entity.Question q : quiz.getQuestions()) {
                com.lms.course.dto.QuizResultDetailDto.QuestionResultDto qDto =
                        new com.lms.course.dto.QuizResultDetailDto.QuestionResultDto();
                qDto.setQuestionId(q.getId());
                qDto.setText(q.getText());
                qDto.setHint(q.getHint());
                qDto.setJustification(q.getJustification());
                qDto.setPoints(q.getPoints());
                qDto.setType(q.getType() != null ? q.getType().name() : null);

                java.util.List<com.lms.course.dto.QuizResultDetailDto.OptionResultDto> opts = new java.util.ArrayList<>();
                if (q.getOptions() != null) {
                    for (com.lms.course.entity.QuestionOption o : q.getOptions()) {
                        opts.add(new com.lms.course.dto.QuizResultDetailDto.OptionResultDto(
                                o.getId(), o.getText(), o.isCorrect()));
                    }
                }
                qDto.setOptions(opts);

                com.lms.course.entity.StudentAnswer sa = answerByQ.get(q.getId());
                if (sa != null) {
                    qDto.setSelectedOptionId(sa.getSelectedOption() != null ? sa.getSelectedOption().getId() : null);
                    qDto.setTextAnswer(sa.getTextAnswer());
                    qDto.setIsCorrect(sa.getIsCorrect());
                }
                qDtos.add(qDto);
            }
        }
        dto.setQuestions(qDtos);
        return dto;
    }

    // --- Forum Methods ---

    public List<com.lms.course.dto.ForumThreadResponseDto> getAllForumThreads() {
        return forumThreadRepository.findAll().stream()
                .map(com.lms.course.dto.ForumThreadResponseDto::fromEntity).toList();
    }

    public List<com.lms.course.dto.ForumThreadResponseDto> getForumThreadsByModuleId(Long moduleId) {
        // Use a simple query to avoid loading relationships
        // Use native query to avoid Hibernate session issues
        List<Object[]> results = forumThreadRepository.findThreadIdsByModuleId(moduleId);
        return results.stream()
                .map(row -> {
                    com.lms.course.dto.ForumThreadResponseDto dto = new com.lms.course.dto.ForumThreadResponseDto();
                    dto.setId(((Number) row[0]).longValue());
                    dto.setTitle((String) row[1]);
                    dto.setContent((String) row[2]);
                    dto.setTag(null); // Skip tag for now
                    dto.setAuthorId((String) row[3]);
                    dto.setAuthorName((String) row[4]);
                    dto.setModuleId(((Number) row[5]).longValue());
                    dto.setModuleName("");
                    dto.setViewCount(((Number) row[6]).longValue());
                    dto.setUpvoteCount(((Number) row[7]).longValue());
                    dto.setPostCount(((Number) row[11]).intValue());
                    dto.setHasSolution(((Number) row[12]).longValue() > 0);
                    dto.setIsClosed((Boolean) row[8]);
                    dto.setCreatedAt((java.time.LocalDateTime) row[9]);
                    dto.setUpdatedAt((java.time.LocalDateTime) row[10]);
                    return dto;
                }).toList();
    }

    @org.springframework.transaction.annotation.Transactional
    public com.lms.course.dto.ForumThreadDetailDto getForumThreadById(Long id, String username) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Thread not found with id: " + id));

        if (username != null && !username.isEmpty()) {
            int inserted = forumThreadViewRepository.insertIfNotExists(id, username);
            if (inserted > 0) {
                thread.setViewCount((thread.getViewCount() == null ? 0L : thread.getViewCount()) + 1);
                forumThreadRepository.save(thread);
            }
        }

        return com.lms.course.dto.ForumThreadDetailDto.fromEntity(thread);
    }

    public com.lms.course.dto.ForumThreadResponseDto createForumThread(com.lms.course.dto.ForumThreadCreateDto dto) {
        CModule module = moduleRepository.findById(dto.getModuleId())
                .orElseThrow(() -> new NotFoundException("Module not found with id: " + dto.getModuleId()));

        if (forumThreadRepository.existsByTitleAndModuleId(dto.getTitle(), dto.getModuleId())) {
            throw new ConflictException("A thread with the same title already exists in this module");
        }

        com.lms.course.entity.ForumThread thread = new com.lms.course.entity.ForumThread();
        thread.setTitle(dto.getTitle());
        thread.setContent(dto.getContent());
        thread.setTag(dto.getTag());
        thread.setAuthorId(dto.getAuthorId());
        thread.setAuthorName(dto.getAuthorName());
        thread.setModule(module);

        return com.lms.course.dto.ForumThreadResponseDto.fromEntity(forumThreadRepository.save(thread));
    }

    public com.lms.course.dto.ForumThreadResponseDto updateForumThread(Long id, com.lms.course.dto.ForumThreadCreateDto dto) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Thread not found with id: " + id));

        if (dto.getTitle() != null) thread.setTitle(dto.getTitle());
        if (dto.getContent() != null) thread.setContent(dto.getContent());
        if (dto.getTag() != null) thread.setTag(dto.getTag());

        return com.lms.course.dto.ForumThreadResponseDto.fromEntity(forumThreadRepository.save(thread));
    }

    @jakarta.transaction.Transactional
    public String deleteForumThread(Long id) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Thread not found with id: " + id));
        forumThreadRepository.delete(thread);
        return "Thread deleted successfully";
    }

    public com.lms.course.entity.ForumPost createForumPost(com.lms.course.dto.ForumPostCreateDto dto) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(dto.getThreadId())
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        com.lms.course.entity.ForumPost post = new com.lms.course.entity.ForumPost();
        post.setContent(dto.getContent());
        post.setAuthorId(dto.getAuthorId());
        post.setAuthorName(dto.getAuthorName());
        post.setThread(thread);

        if (dto.getParentPostId() != null) {
            com.lms.course.entity.ForumPost parentPost = forumPostRepository.findById(dto.getParentPostId())
                    .orElseThrow(() -> new NotFoundException("Parent post not found"));
            post.setParentPost(parentPost);
        }

        try {
            restTemplate.postForObject("http://user-service/api/user/gamification/" + dto.getAuthorId() + "/xp?amount=15", null, String.class);
        } catch (Exception e) {
            System.err.println("Failed to award forum XP: " + e.getMessage());
        }

        return forumPostRepository.save(post);
    }

    public com.lms.course.entity.ForumPost updateForumPost(Long id, String content) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found with id: " + id));
        post.setContent(content);
        post.setIsEdited(true);
        return forumPostRepository.save(post);
    }

    @jakarta.transaction.Transactional
    public String deleteForumPost(Long id) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found with id: " + id));
        forumPostRepository.delete(post);
        return "Post deleted successfully";
    }

    @org.springframework.transaction.annotation.Transactional
    public void upvoteThread(Long threadId, String userId) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(threadId)
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        forumUpvoteRepository.findByUserIdAndThreadId(userId, threadId)
                .ifPresentOrElse(
                        upvote -> {},
                        () -> {
                            com.lms.course.entity.ForumUpvote upvote = new com.lms.course.entity.ForumUpvote();
                            upvote.setUserId(userId);
                            upvote.setThread(thread);
                            forumUpvoteRepository.save(upvote);
                            long current = thread.getUpvoteCount() != null ? thread.getUpvoteCount() : 0L;
                            thread.setUpvoteCount(current + 1);
                            forumThreadRepository.save(thread);
                        }
                );
    }

    @org.springframework.transaction.annotation.Transactional
    public void upvotePost(Long postId, String userId) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        forumUpvoteRepository.findByUserIdAndPostId(userId, postId)
                .ifPresentOrElse(
                        upvote -> {},
                        () -> {
                            com.lms.course.entity.ForumUpvote upvote = new com.lms.course.entity.ForumUpvote();
                            upvote.setUserId(userId);
                            upvote.setPost(post);
                            forumUpvoteRepository.save(upvote);
                            long current = post.getUpvoteCount() != null ? post.getUpvoteCount() : 0L;
                            post.setUpvoteCount(current + 1);
                            forumPostRepository.save(post);
                        }
                );
    }

    @org.springframework.transaction.annotation.Transactional
    public void removeUpvoteThread(Long threadId, String userId) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(threadId)
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        forumUpvoteRepository.findByUserIdAndThreadId(userId, threadId)
                .ifPresent(upvote -> {
                    forumUpvoteRepository.delete(upvote);
                    if (thread.getUpvoteCount() > 0) {
                        thread.setUpvoteCount(thread.getUpvoteCount() - 1);
                        forumThreadRepository.save(thread);
                    }
                });
    }

    @org.springframework.transaction.annotation.Transactional
    public void removeUpvotePost(Long postId, String userId) {
        com.lms.course.entity.ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        forumUpvoteRepository.findByUserIdAndPostId(userId, postId)
                .ifPresent(upvote -> {
                    forumUpvoteRepository.delete(upvote);
                    if (post.getUpvoteCount() > 0) {
                        post.setUpvoteCount(post.getUpvoteCount() - 1);
                        forumPostRepository.save(post);
                    }
                });
    }

    @org.springframework.transaction.annotation.Transactional
    public void markPostAsSolution(Long postId, Long threadId) {
        com.lms.course.entity.ForumThread thread = forumThreadRepository.findById(threadId)
                .orElseThrow(() -> new NotFoundException("Thread not found"));

        com.lms.course.entity.ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getThread().getId().equals(threadId)) {
            throw new ConflictException("Post does not belong to this thread");
        }

        if (thread.getSolution() != null) {
            thread.getSolution().setIsSolution(false);
            forumPostRepository.save(thread.getSolution());
        }

        post.setIsSolution(true);
        forumPostRepository.save(post);
        thread.setSolution(post);
        forumThreadRepository.save(thread);
    }
}
