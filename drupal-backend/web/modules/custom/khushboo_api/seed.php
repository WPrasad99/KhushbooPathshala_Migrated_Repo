<?php

/**
 * Seed script for Khushboo Pathshala Drupal Backend.
 */

use Drupal\Core\Database\Database;

$connection = Database::getConnection();

echo "🌱 Starting Khushboo Pathshala Seed on Drupal MariaDB...\n";

// Clear existing tables
$tables = [
  'kp_login_logs', 'kp_notifications', 'kp_roadmaps', 'kp_chat_messages',
  'kp_chat_members', 'kp_chat_groups', 'kp_announcements', 'kp_forum_answers',
  'kp_forum_posts', 'kp_quiz_submissions', 'kp_quizzes', 'kp_assignment_submissions',
  'kp_assignments', 'kp_meetings', 'kp_mentorship', 'kp_session_tracking',
  'kp_resources', 'kp_batch_mentors', 'kp_batch_students', 'kp_batches', 'kp_users'
];

foreach ($tables as $tbl) {
  $connection->truncate($tbl)->execute();
}

$passwordHash = password_hash('password123', PASSWORD_BCRYPT);
$adminPasswordHash = password_hash('password123', PASSWORD_BCRYPT);
$now = time();

// 1. Users
$adminId = 'user_admin_01';
$mentor1Id = 'user_mentor_rakesh';
$mentor2Id = 'user_mentor_priya';
$student1Id = 'user_student_prasad';
$student2Id = 'user_student_anita';
$student3Id = 'user_student_vishal';

$users = [
  [
    'id' => $adminId,
    'email' => 'admin@cybage.com',
    'password_hash' => $adminPasswordHash,
    'name' => 'Admin User',
    'role' => 'ADMIN',
    'phone' => '+91 9876543210',
    'gender' => 'male',
    'education_level' => 'Masters',
    'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    'bio' => 'System administrator for Khushboo Scholarship Program',
    'profile_completed' => 1,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $mentor1Id,
    'email' => 'rakesh.sinha@cybage.com',
    'password_hash' => $passwordHash,
    'name' => 'Rakesh Sinha',
    'role' => 'MENTOR',
    'phone' => '+91 9876543211',
    'gender' => 'male',
    'education_level' => 'Masters in CS',
    'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=rakesh',
    'bio' => 'Lead Technology Mentor specializing in Web Development & Cloud Systems',
    'skills' => 'React, Drupal, Node.js, PHP, System Architecture',
    'profile_completed' => 1,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $mentor2Id,
    'email' => 'priya.sharma@cybage.com',
    'password_hash' => $passwordHash,
    'name' => 'Priya Sharma',
    'role' => 'MENTOR',
    'phone' => '+91 9876543212',
    'gender' => 'female',
    'education_level' => 'M.Tech',
    'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
    'bio' => 'Senior Mentor specializing in Data Science and Career Guidance',
    'skills' => 'Python, Data Science, AI/ML, Interview Preparation',
    'profile_completed' => 1,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $student1Id,
    'email' => 'prasad@example.com',
    'password_hash' => $passwordHash,
    'name' => 'Prasad Wadkar',
    'role' => 'STUDENT',
    'phone' => '+91 9876543213',
    'gender' => 'male',
    'date_of_birth' => '2000-05-15',
    'education_level' => 'B.Tech Computer Science',
    'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=prasad',
    'bio' => 'Enthusiastic developer and Cybage Khushboo Scholar',
    'skills' => 'JavaScript, React, PHP, SQL',
    'hobbies' => 'Coding, Robotics, Chess',
    'profile_completed' => 1,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $student2Id,
    'email' => 'anita.sharma@example.com',
    'password_hash' => $passwordHash,
    'name' => 'Anita Sharma',
    'role' => 'STUDENT',
    'phone' => '+91 9876543214',
    'gender' => 'female',
    'date_of_birth' => '2001-08-20',
    'education_level' => 'B.E. Information Technology',
    'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=anita',
    'profile_completed' => 1,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $student3Id,
    'email' => 'vishal.patel@example.com',
    'password_hash' => $passwordHash,
    'name' => 'Vishal Patel',
    'role' => 'STUDENT',
    'phone' => '+91 9876543215',
    'gender' => 'male',
    'date_of_birth' => '2000-12-10',
    'education_level' => 'B.Tech',
    'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=vishal',
    'profile_completed' => 1,
    'created_at' => $now,
    'updated_at' => $now,
  ],
];

foreach ($users as $u) {
  $connection->insert('kp_users')->fields($u)->execute();
}
echo "✅ Users created (Admin: admin@cybage.com / c, Mentor: rakesh.sinha@cybage.com / password123, Student: prasad@example.com / password123)\n";

// 2. Batches
$batch1Id = 'batch_2026_eng';
$batch2Id = 'batch_2025_cs';

$connection->insert('kp_batches')->fields([
  'id' => $batch1Id,
  'name' => 'Engineering Scholars 2026',
  'description' => 'Flagship cohort for engineering and tech scholars',
  'code' => 'ENG-2026',
  'start_date' => '2026-01-01',
  'end_date' => '2026-12-31',
  'created_at' => $now,
  'updated_at' => $now,
])->execute();

$connection->insert('kp_batches')->fields([
  'id' => $batch2Id,
  'name' => 'Computer Science Scholars 2025',
  'description' => 'Advanced computer science & placement batch',
  'code' => 'CS-2025',
  'start_date' => '2025-06-01',
  'end_date' => '2026-06-01',
  'created_at' => $now,
  'updated_at' => $now,
])->execute();

// Enroll students & mentors in batches
$connection->insert('kp_batch_students')->fields(['id' => 'bs_1', 'batch_id' => $batch1Id, 'user_id' => $student1Id, 'joined_at' => $now])->execute();
$connection->insert('kp_batch_students')->fields(['id' => 'bs_2', 'batch_id' => $batch1Id, 'user_id' => $student2Id, 'joined_at' => $now])->execute();
$connection->insert('kp_batch_students')->fields(['id' => 'bs_3', 'batch_id' => $batch2Id, 'user_id' => $student3Id, 'joined_at' => $now])->execute();

$connection->insert('kp_batch_mentors')->fields(['id' => 'bm_1', 'batch_id' => $batch1Id, 'user_id' => $mentor1Id, 'assigned_at' => $now])->execute();
$connection->insert('kp_batch_mentors')->fields(['id' => 'bm_2', 'batch_id' => $batch2Id, 'user_id' => $mentor2Id, 'assigned_at' => $now])->execute();

// 3. Mentorship relationship
$connection->insert('kp_mentorship')->fields([
  'id' => 'mship_1',
  'mentor_id' => $mentor1Id,
  'mentee_id' => $student1Id,
  'assigned_at' => $now,
  'status' => 'ACTIVE',
])->execute();

// 4. Learning Resources
$res1 = 'res_web_dev';
$res2 = 'res_data_science';
$res3 = 'res_soft_skills';
$res4 = 'res_resume_tips';
$res5 = 'res_python_basics';
$res6 = 'res_interview_prep';

$resources = [
  [
    'id' => $res1,
    'title' => 'Web Development Essentials',
    'description' => 'Learn the fundamentals of web development including HTML, CSS, JavaScript, and React.',
    'category' => 'TECHNICAL_SKILLS',
    'video_url' => 'https://www.youtube.com/embed/UB1O30fR-EE',
    'duration' => 60,
    'thumbnail_url' => 'https://img.youtube.com/vi/UB1O30fR-EE/maxresdefault.jpg',
    'lessons_count' => 30,
    'lessons' => json_encode([
      ['title' => '1. Introduction to Web Architecture', 'videoId' => 'UB1O30fR-EE', 'duration' => 15],
      ['title' => '2. Modern HTML5 & Responsive CSS', 'videoId' => 'UB1O30fR-EE', 'duration' => 20],
      ['title' => '3. JavaScript ES6+ Essentials', 'videoId' => 'UB1O30fR-EE', 'duration' => 25],
    ]),
    'is_hot' => 1,
    'type' => 'COURSE',
    'batch_id' => $batch1Id,
    'uploaded_by_id' => $mentor1Id,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $res2,
    'title' => 'Data Science Fundamentals',
    'description' => 'Introduction to data science concepts, Python, and machine learning basics.',
    'category' => 'TECHNICAL_SKILLS',
    'video_url' => 'https://www.youtube.com/embed/ua-CiDNNj30',
    'duration' => 45,
    'thumbnail_url' => 'https://img.youtube.com/vi/ua-CiDNNj30/maxresdefault.jpg',
    'lessons_count' => 40,
    'lessons' => json_encode([
      ['title' => '1. Data Science Workflow Overview', 'videoId' => 'ua-CiDNNj30', 'duration' => 20],
      ['title' => '2. NumPy & Pandas In-Depth', 'videoId' => 'ua-CiDNNj30', 'duration' => 25],
    ]),
    'is_hot' => 1,
    'type' => 'COURSE',
    'batch_id' => $batch1Id,
    'uploaded_by_id' => $mentor1Id,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $res3,
    'title' => 'Effective Communication & Presentation',
    'description' => 'Master the art of professional communication and presentation skills.',
    'category' => 'SOFT_SKILLS',
    'video_url' => 'https://www.youtube.com/embed/eIho2S0ZahI',
    'duration' => 30,
    'thumbnail_url' => 'https://img.youtube.com/vi/eIho2S0ZahI/maxresdefault.jpg',
    'lessons_count' => 15,
    'lessons' => '[]',
    'is_hot' => 0,
    'type' => 'SESSION',
    'batch_id' => $batch1Id,
    'uploaded_by_id' => $mentor2Id,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $res4,
    'title' => 'Resume Writing & LinkedIn Optimization',
    'description' => 'How to create an impressive resume and standout LinkedIn presence.',
    'category' => 'CAREER_GUIDANCE',
    'video_url' => 'https://www.youtube.com/embed/Tt08KmFfIYQ',
    'duration' => 20,
    'thumbnail_url' => 'https://img.youtube.com/vi/Tt08KmFfIYQ/maxresdefault.jpg',
    'lessons_count' => 10,
    'lessons' => '[]',
    'is_hot' => 0,
    'type' => 'RESOURCE',
    'batch_id' => $batch1Id,
    'uploaded_by_id' => $mentor2Id,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $res5,
    'title' => 'Python Basics to Advanced',
    'description' => 'Complete Python programming course with algorithmic problem solving.',
    'category' => 'TECHNICAL_SKILLS',
    'video_url' => 'https://www.youtube.com/embed/kqtD5dpn9C8',
    'duration' => 60,
    'thumbnail_url' => 'https://img.youtube.com/vi/kqtD5dpn9C8/maxresdefault.jpg',
    'lessons_count' => 50,
    'lessons' => '[]',
    'is_hot' => 1,
    'type' => 'COURSE',
    'batch_id' => $batch2Id,
    'uploaded_by_id' => $mentor1Id,
    'created_at' => $now,
    'updated_at' => $now,
  ],
  [
    'id' => $res6,
    'title' => 'Mastering Technical Interviews',
    'description' => 'Complete guide to cracking technical and behavioral interviews at top product companies.',
    'category' => 'CAREER_GUIDANCE',
    'video_url' => 'https://www.youtube.com/embed/II5Mja9U7iI',
    'duration' => 45,
    'thumbnail_url' => 'https://img.youtube.com/vi/II5Mja9U7iI/maxresdefault.jpg',
    'lessons_count' => 25,
    'lessons' => '[]',
    'is_hot' => 1,
    'type' => 'SESSION',
    'batch_id' => $batch1Id,
    'uploaded_by_id' => $mentor2Id,
    'created_at' => $now,
    'updated_at' => $now,
  ],
];

foreach ($resources as $r) {
  $connection->insert('kp_resources')->fields($r)->execute();
}
echo "✅ Learning Resources created\n";

// 5. Session tracking & Auto-Attendance
$connection->insert('kp_session_tracking')->fields([
  'id' => 'st_1',
  'user_id' => $student1Id,
  'resource_id' => $res1,
  'watch_duration' => 3200,
  'total_duration' => 3600,
  'drop_off_point' => 3200,
  'completion_percentage' => 89,
  'attendance_marked' => 1,
  'created_at' => $now - 86400,
  'updated_at' => $now - 86400,
])->execute();

$connection->insert('kp_session_tracking')->fields([
  'id' => 'st_2',
  'user_id' => $student1Id,
  'resource_id' => $res2,
  'watch_duration' => 2500,
  'total_duration' => 2700,
  'drop_off_point' => 2500,
  'completion_percentage' => 92,
  'attendance_marked' => 1,
  'created_at' => $now - 43200,
  'updated_at' => $now - 43200,
])->execute();

// 6. Meetings
$connection->insert('kp_meetings')->fields([
  'id' => 'meet_1',
  'mentor_id' => $mentor1Id,
  'mentee_id' => $student1Id,
  'batch_id' => $batch1Id,
  'title' => 'Sprint 1: Architecture Review & Mentorship Check-in',
  'description' => 'Review of student learning progress and project assignments.',
  'meeting_link' => 'https://meet.google.com/xyz-abc-def',
  'scheduled_at' => date('Y-m-d H:i:s', strtotime('+2 days 10:00:00')),
  'status' => 'SCHEDULED',
  'created_at' => $now,
])->execute();

// 7. Assignments
$assign1 = 'assign_01';
$connection->insert('kp_assignments')->fields([
  'id' => $assign1,
  'title' => 'Build a Responsive React Portfolio with Tailwind CSS',
  'description' => 'Create a modern, accessible web portfolio demonstrating responsive design, semantic HTML5, and component architecture.',
  'batch_id' => $batch1Id,
  'due_date' => date('Y-m-d', strtotime('+5 days')),
  'created_by_id' => $mentor1Id,
  'created_at' => $now,
  'updated_at' => $now,
])->execute();

$connection->insert('kp_assignment_submissions')->fields([
  'id' => 'sub_01',
  'assignment_id' => $assign1,
  'student_id' => $student1Id,
  'submission_url' => 'https://github.com/prasad/react-portfolio',
  'file_path' => '',
  'notes' => 'Implemented complete responsive portfolio with dark theme support.',
  'grade' => 'A+',
  'feedback' => 'Exceptional code structure and component reusability! Approved.',
  'status' => 'REVIEWED',
  'submitted_at' => $now - 3600,
  'reviewed_at' => $now - 1800,
  'reviewed_by_id' => $mentor1Id,
])->execute();

// 8. Quizzes
$quiz1 = 'quiz_01';
$connection->insert('kp_quizzes')->fields([
  'id' => $quiz1,
  'title' => 'React & JavaScript Modern Standards Assessment',
  'description' => 'Test your core concepts in React hooks, state management, and modern ES6.',
  'batch_id' => $batch1Id,
  'created_by_id' => $mentor1Id,
  'duration_minutes' => 30,
  'passing_score' => 70,
  'questions' => json_encode([
    [
      'question' => 'Which hook is used for performing side effects in functional components?',
      'options' => ['useState', 'useEffect', 'useMemo', 'useRef'],
      'correctIndex' => 1,
    ],
    [
      'question' => 'What is the virtual DOM in React?',
      'options' => ['A direct copy of HTML', 'An in-memory representation of real DOM', 'A shadow DOM specification', 'A browser plugin'],
      'correctIndex' => 1,
    ],
    [
      'question' => 'Which HTTP method is idempotent?',
      'options' => ['POST', 'PUT', 'PATCH', 'CONNECT'],
      'correctIndex' => 1,
    ],
  ]),
  'created_at' => $now,
])->execute();

// 9. Forum Posts & Answers
$post1 = 'post_01';
$connection->insert('kp_forum_posts')->fields([
  'id' => $post1,
  'user_id' => $student1Id,
  'batch_id' => $batch1Id,
  'title' => 'Best practices for handling JWT authentication in Decoupled architectures?',
  'content' => 'What are the recommended approaches for storing JWT tokens securely when pairing a React SPA with a headless Drupal PHP backend?',
  'tags' => 'React,Drupal,Security,JWT',
  'upvotes' => 8,
  'created_at' => $now - 7200,
  'updated_at' => $now - 7200,
])->execute();

$connection->insert('kp_forum_answers')->fields([
  'id' => 'ans_01',
  'post_id' => $post1,
  'user_id' => $mentor1Id,
  'content' => 'Great question! In production, secure HttpOnly SameSite cookies or short-lived Bearer tokens in memory with refresh mechanisms provide top-class enterprise security.',
  'upvotes' => 12,
  'is_accepted' => 1,
  'created_at' => $now - 3600,
])->execute();

// 10. Announcements
$connection->insert('kp_announcements')->fields([
  'id' => 'ann_01',
  'title' => '🎉 Welcome to Khushboo Pathshala on Drupal & React!',
  'content' => 'The platform backend has been fully upgraded to Drupal 11 PHP enterprise architecture. Enjoy enhanced speed, scalability, and seamless learning!',
  'priority' => 'HIGH',
  'author_id' => $adminId,
  'batch_id' => NULL,
  'created_at' => $now,
])->execute();

// 11. Chat Groups & Messages
$grp1 = 'grp_general';
$connection->insert('kp_chat_groups')->fields([
  'id' => $grp1,
  'name' => 'General Scholars Discussion',
  'type' => 'GROUP',
  'batch_id' => $batch1Id,
  'created_by_id' => $adminId,
  'created_at' => $now,
])->execute();

$connection->insert('kp_chat_messages')->fields([
  'id' => 'msg_01',
  'group_id' => $grp1,
  'sender_id' => $mentor1Id,
  'content' => 'Hello everyone! Welcome to the new semester on Khushboo Pathshala. Feel free to ask any technical questions here!',
  'attachments' => '[]',
  'created_at' => $now - 1200,
])->execute();

// 12. Login Logs for Activity Heatmap
for ($i = 25; $i >= 0; $i--) {
  $connection->insert('kp_login_logs')->fields([
    'id' => 'log_' . $i,
    'user_id' => $student1Id,
    'ip_address' => '127.0.0.1',
    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'created_at' => $now - ($i * 86400),
  ])->execute();
}

echo "✨ All seed data successfully populated into MariaDB!\n";

