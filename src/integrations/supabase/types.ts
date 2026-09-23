export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assignment_submissions: {
        Row: {
          assignment_id: string
          attempt_id: string | null
          content: string | null
          created_at: string
          feedback: string | null
          file_url: string | null
          grade: number | null
          id: string
          is_late: boolean
          score: number | null
          student_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          attempt_id?: string | null
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          is_late?: boolean
          score?: number | null
          student_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          attempt_id?: string | null
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          is_late?: boolean
          score?: number | null
          student_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachment_url: string | null
          class_id: string
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: string
          kind: string
          max_score: number
          mock_exam_id: string | null
          starts_at: string
          title: string
          topic_id: string | null
          updated_at: string
          video_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          class_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind?: string
          max_score?: number
          mock_exam_id?: string | null
          starts_at?: string
          title: string
          topic_id?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind?: string
          max_score?: number
          mock_exam_id?: string | null
          starts_at?: string
          title?: string
          topic_id?: string | null
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_mock_exam_id_fkey"
            columns: ["mock_exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          attempt_id: string | null
          code: string
          created_at: string
          full_name: string
          id: string
          issued_at: string
          percent: number
          score: number
          subtitle: string | null
          title: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          code: string
          created_at?: string
          full_name: string
          id?: string
          issued_at?: string
          percent?: number
          score?: number
          subtitle?: string | null
          title: string
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          code?: string
          created_at?: string
          full_name?: string
          id?: string
          issued_at?: string
          percent?: number
          score?: number
          subtitle?: string | null
          title?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_student_id_profiles_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_messages: {
        Row: {
          body: string
          class_id: string
          created_at: string
          file_url: string | null
          id: string
          is_announcement: boolean
          media_duration: number | null
          media_type: string | null
          media_url: string | null
          user_id: string
        }
        Insert: {
          body: string
          class_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_announcement?: boolean
          media_duration?: number | null
          media_type?: string | null
          media_url?: string | null
          user_id: string
        }
        Update: {
          body?: string
          class_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_announcement?: boolean
          media_duration?: number | null
          media_type?: string | null
          media_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_messages_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          join_code: string
          name: string
          subject: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          join_code: string
          name: string
          subject?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          join_code?: string
          name?: string
          subject?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_test_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "global_test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "global_test_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_test_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "global_test_options"
            referencedColumns: ["id"]
          },
        ]
      }
      global_test_attempts: {
        Row: {
          completed_at: string | null
          correct_count: number
          created_at: string
          id: string
          score: number
          started_at: string
          test_id: string
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          id?: string
          score?: number
          started_at?: string
          test_id: string
          time_spent_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          id?: string
          score?: number
          started_at?: string
          test_id?: string
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "global_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      global_test_options: {
        Row: {
          body: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          sort_order: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          sort_order?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "global_test_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "global_test_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      global_test_questions: {
        Row: {
          body: string
          created_at: string
          explanation: string | null
          id: string
          image_url: string | null
          sort_order: number
          test_id: string
        }
        Insert: {
          body: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          test_id: string
        }
        Update: {
          body?: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "global_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      global_tests: {
        Row: {
          code: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mock_exam_questions: {
        Row: {
          created_at: string
          id: string
          mock_exam_id: string
          question_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          mock_exam_id: string
          question_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          mock_exam_id?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_questions_mock_exam_id_fkey"
            columns: ["mock_exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exams: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          direction: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          direction: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          direction?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          last_active_at: string | null
          level: number
          phone: string | null
          region: string | null
          school: string | null
          streak_days: number
          subject: Database["public"]["Enums"]["subject_key"]
          updated_at: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_banned?: boolean
          last_active_at?: string | null
          level?: number
          phone?: string | null
          region?: string | null
          school?: string | null
          streak_days?: number
          subject?: Database["public"]["Enums"]["subject_key"]
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean
          last_active_at?: string | null
          level?: number
          phone?: string | null
          region?: string | null
          school?: string | null
          streak_days?: number
          subject?: Database["public"]["Enums"]["subject_key"]
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      question_options: {
        Row: {
          body: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          sort_order: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          sort_order?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          body: string
          created_at: string
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          explanation: string | null
          id: string
          image_url: string | null
          section: string | null
          sort_order: number
          topic_id: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          body: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          id?: string
          image_url?: string | null
          section?: string | null
          sort_order?: number
          topic_id: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          explanation?: string | null
          id?: string
          image_url?: string | null
          section?: string | null
          sort_order?: number
          topic_id?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          completed_at: string | null
          correct_count: number
          created_at: string
          id: string
          mock_exam_id: string | null
          score: number
          started_at: string
          time_spent_seconds: number | null
          topic_id: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          id?: string
          mock_exam_id?: string | null
          score?: number
          started_at?: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          id?: string
          mock_exam_id?: string | null
          score?: number
          started_at?: string
          time_spent_seconds?: number | null
          topic_id?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_mock_exam_id_fkey"
            columns: ["mock_exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category: Database["public"]["Enums"]["topic_category"]
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          module_id: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["topic_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          module_id?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["topic_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          module_id?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser: string | null
          created_at: string
          device_key: string
          device_name: string
          id: string
          is_mobile: boolean
          last_seen_at: string
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_key: string
          device_name?: string
          id?: string
          is_mobile?: boolean
          last_seen_at?: string
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_key?: string
          device_name?: string
          id?: string
          is_mobile?: boolean
          last_seen_at?: string
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_lessons: {
        Row: {
          author: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_published: boolean
          module_id: string | null
          pdf_url: string | null
          sort_order: number
          subject: string
          thumbnail_url: string | null
          title: string
          topic_id: string | null
          updated_at: string
          video_url: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          module_id?: string | null
          pdf_url?: string | null
          sort_order?: number
          subject?: string
          thumbnail_url?: string | null
          title: string
          topic_id?: string | null
          updated_at?: string
          video_url: string
        }
        Update: {
          author?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          module_id?: string | null
          pdf_url?: string | null
          sort_order?: number
          subject?: string
          thumbnail_url?: string | null
          title?: string
          topic_id?: string | null
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_lessons_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          seconds_watched: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          seconds_watched?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          seconds_watched?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      written_tasks: {
        Row: {
          body: string
          created_at: string
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          expected_answer: string | null
          id: string
          image_url: string | null
          is_published: boolean
          max_score: number
          mode: string
          solution: string | null
          sort_order: number
          topic_id: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          expected_answer?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          max_score?: number
          mode?: string
          solution?: string | null
          sort_order?: number
          topic_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          expected_answer?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          max_score?: number
          mode?: string
          solution?: string | null
          sort_order?: number
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "written_tasks_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          last_active_at: string | null
          level: number
          phone: string | null
          region: string | null
          school: string | null
          streak_days: number
          subject: Database["public"]["Enums"]["subject_key"]
          updated_at: string
          username: string | null
          xp: number
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_set_banned: {
        Args: { _banned: boolean; _user_id: string }
        Returns: undefined
      }
      admin_test_overview: {
        Args: never
        Returns: {
          attempts: number
          avg_score: number
          best_score: number
          id: string
          kind: string
          last_attempt: string
          title: string
        }[]
      }
      admin_test_results: {
        Args: { _topic_id: string }
        Returns: {
          attempt_id: string
          completed_at: string
          correct_count: number
          created_at: string
          full_name: string
          score: number
          time_spent_seconds: number
          total_questions: number
          user_id: string
          username: string
        }[]
      }
      claim_admin_if_none: { Args: never; Returns: boolean }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          last_active_at: string | null
          level: number
          phone: string | null
          region: string | null
          school: string | null
          streak_days: number
          subject: Database["public"]["Enums"]["subject_key"]
          updated_at: string
          username: string | null
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      global_test_by_code: {
        Args: { _code: string }
        Returns: {
          description: string
          duration_minutes: number
          id: string
          title: string
        }[]
      }
      global_test_items_by_code: {
        Args: { _code: string }
        Returns: {
          body: string
          image_url: string
          options: Json
          question_id: string
          sort_order: number
        }[]
      }
      global_test_results: {
        Args: { _test_id: string }
        Returns: {
          attempt_id: string
          completed_at: string
          correct_count: number
          full_name: string
          score: number
          time_spent_seconds: number
          total_questions: number
          user_id: string
        }[]
      }
      has_global_attempt: {
        Args: { _test_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assignment_teacher: {
        Args: { _assignment_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_global_test_owner: {
        Args: { _test_id: string; _user_id: string }
        Returns: boolean
      }
      join_class_by_code: { Args: { _code: string }; Returns: string }
      leaderboard_rows: {
        Args: never
        Returns: {
          full_name: string
          id: string
          level: number
          same_country: boolean
          same_region: boolean
          same_school: boolean
          streak_days: number
          username: string
          xp: number
        }[]
      }
      set_initial_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      submit_global_test: {
        Args: { _answers: Json; _code: string; _time_spent_seconds: number }
        Returns: string
      }
      submit_test_attempt: {
        Args: {
          _answers: Json
          _mock_exam_id: string
          _time_spent_seconds: number
          _topic_id: string
        }
        Returns: string
      }
      touch_last_active: { Args: never; Returns: undefined }
      verify_certificate: {
        Args: { _code: string }
        Returns: {
          code: string
          full_name: string
          issued_at: string
          percent: number
          score: number
          subtitle: string
          title: string
          total_questions: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "premium"
      question_difficulty: "easy" | "medium" | "hard"
      subject_key: "matematika" | "fizika" | "kimyo" | "biologiya" | "tarix"
      topic_category:
        | "algebra"
        | "geometriya"
        | "milliy-sertifikat"
        | "dtm"
        | "attestatsiya"
        | "boshqa"
        | "mavzulashtirilgan"
        | "olimpiada"
        | "sat"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student", "premium"],
      question_difficulty: ["easy", "medium", "hard"],
      subject_key: ["matematika", "fizika", "kimyo", "biologiya", "tarix"],
      topic_category: [
        "algebra",
        "geometriya",
        "milliy-sertifikat",
        "dtm",
        "attestatsiya",
        "boshqa",
        "mavzulashtirilgan",
        "olimpiada",
        "sat",
      ],
    },
  },
} as const
