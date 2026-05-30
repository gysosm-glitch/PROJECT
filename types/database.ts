// Database Types - auto-generated from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          student_id: string
          avatar_url: string | null
          role: 'user' | 'admin'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname: string
          student_id: string
          avatar_url?: string | null
          role?: 'user' | 'admin'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      contest_profiles: {
        Row: {
          id: string
          user_id: string
          department: string
          gender: 'male' | 'female' | 'other' | null
          age: number | null
          contest_count: number
          certificates: string[]
          fields: string[]
          intro: string | null
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department: string
          gender?: 'male' | 'female' | 'other' | null
          age?: number | null
          contest_count?: number
          certificates?: string[]
          fields?: string[]
          intro?: string | null
          is_visible?: boolean
        }
        Update: Partial<Database['public']['Tables']['contest_profiles']['Insert']>
      }
      sports_profiles: {
        Row: {
          id: string
          user_id: string
          gender: 'male' | 'female' | 'other' | null
          age: number | null
          sports: string[]
          career_years: number
          is_pro: boolean
          intro: string | null
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gender?: 'male' | 'female' | 'other' | null
          age?: number | null
          sports?: string[]
          career_years?: number
          is_pro?: boolean
          intro?: string | null
          is_visible?: boolean
        }
        Update: Partial<Database['public']['Tables']['sports_profiles']['Insert']>
      }
      contests: {
        Row: {
          id: string
          title: string
          organizer: string | null
          field: ContestField
          region: ContestRegion | null
          max_participants: number | null
          start_date: string | null
          end_date: string
          prize: string | null
          target: string | null
          url: string
          thumbnail_url: string | null
          is_active: boolean
          source: string | null
          last_crawled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          organizer?: string | null
          field: ContestField
          region?: ContestRegion | null
          max_participants?: number | null
          start_date?: string | null
          end_date: string
          prize?: string | null
          target?: string | null
          url: string
          thumbnail_url?: string | null
          is_active?: boolean
          source?: string | null
          last_crawled_at?: string
        }
        Update: Partial<Database['public']['Tables']['contests']['Insert']>
      }
      sports_reservations: {
        Row: {
          id: string
          facility: FacilityType
          reservation_date: string
          start_time: string
          end_time: string
          status: ReservationStatus
          last_crawled_at: string
        }
        Insert: {
          id?: string
          facility: FacilityType
          reservation_date: string
          start_time: string
          end_time: string
          status: ReservationStatus
          last_crawled_at?: string
        }
        Update: Partial<Database['public']['Tables']['sports_reservations']['Insert']>
      }
      matches: {
        Row: {
          id: string
          type: 'contest' | 'sports'
          requester_id: string
          receiver_id: string
          contest_id: string | null
          reservation_id: string | null
          status: MatchStatus
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'contest' | 'sports'
          requester_id: string
          receiver_id: string
          contest_id?: string | null
          reservation_id?: string | null
          status?: MatchStatus
          message?: string | null
        }
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          detail: string | null
          status: 'pending' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          detail?: string | null
          status?: 'pending' | 'resolved' | 'dismissed'
        }
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          content: string
          is_read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          content: string
          is_read?: boolean
          related_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      recruitment_rooms: {
        Row: {
          id: string
          host_id: string
          type: 'contest' | 'sports'
          contest_id: string | null
          sports_facility: FacilityType | null
          sports_date: string | null
          sports_start_time: string | null
          sports_end_time: string | null
          title: string
          description: string | null
          required_members: number
          current_members: number
          status: 'active' | 'closed' | 'cancelled'
          is_recruiting: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          type: 'contest' | 'sports'
          contest_id?: string | null
          sports_facility?: FacilityType | null
          sports_date?: string | null
          sports_start_time?: string | null
          sports_end_time?: string | null
          title: string
          description?: string | null
          required_members: number
          current_members?: number
          status?: 'active' | 'closed' | 'cancelled'
          is_recruiting?: boolean
        }
        Update: Partial<Database['public']['Tables']['recruitment_rooms']['Insert']>
      }
      room_applications: {
        Row: {
          id: string
          room_id: string
          applicant_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message: string | null
          applied_at: string
          decided_at: string | null
        }
        Insert: {
          id?: string
          room_id: string
          applicant_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          message?: string | null
          applied_at?: string
          decided_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['room_applications']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      user_evaluations: {
        Row: {
          id: string
          room_id: string
          reviewer_id: string
          reviewee_id: string
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          reviewer_id: string
          reviewee_id: string
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_evaluations']['Insert']>
      }
    }
  }
}

// Enum types
export type ContestField =
  | 'marketing'
  | 'video'
  | 'design'
  | 'literature'
  | 'it'
  | 'arts'
  | 'academic'

export type ContestRegion = '충청북도' | '충청남도' | '세종특별자치시' | '대전광역시'

export type FacilityType =
  | 'futsal_a' | 'futsal_b'
  | 'basketball_a' | 'basketball_b'

// 시설 그룹 타입 (필터 UI용)
export type FacilityGroup = 'futsal' | 'basketball' | 'other'

export type ReservationStatus = 'available' | 'reserved' | 'closed'

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export type NotificationType =
  | 'match_request'
  | 'match_accepted'
  | 'match_rejected'
  | 'room_application'
  | 'room_accepted'
  | 'room_rejected'

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type ContestProfile = Database['public']['Tables']['contest_profiles']['Row']
export type SportsProfile = Database['public']['Tables']['sports_profiles']['Row']
export type Contest = Database['public']['Tables']['contests']['Row']
export type SportsReservation = Database['public']['Tables']['sports_reservations']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type RecruitmentRoom = Database['public']['Tables']['recruitment_rooms']['Row']
export type RoomApplication = Database['public']['Tables']['room_applications']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type UserEvaluation = Database['public']['Tables']['user_evaluations']['Row']

// UI helper maps
export const CONTEST_FIELD_LABELS: Record<ContestField, string> = {
  marketing: '마케팅·아이디어',
  video: '영상·UCC·사진',
  design: '디자인',
  literature: '문학·글',
  it: 'IT·소프트웨어',
  arts: '예체능·음악·미술',
  academic: '학술·창업·논술',
}

export const CONTEST_REGION_LABELS: Record<ContestRegion, string> = {
  '충청북도': '충청북도',
  '충청남도': '충청남도',
  '세종특별자치시': '세종',
  '대전광역시': '대전',
}

export const CONTEST_REGION_EMOJIS: Record<ContestRegion, string> = {
  '충청북도': '🏔️',
  '충청남도': '🌊',
  '세종특별자치시': '🏛️',
  '대전광역시': '⚗️',
}

export const FACILITY_LABELS: Record<FacilityType | 'other', string> = {
  futsal_a: '풋살장 A코트',
  futsal_b: '풋살장 B코트',
  basketball_a: '농구장 A코트',
  basketball_b: '농구장 B코트',
  other: '기타 종목 (탁구, 배드민턴 등 직접 입력)',
}

// 시설 그룹 → 소속 코트 목록
export const FACILITY_GROUP_COURTS: Record<FacilityGroup, (FacilityType | 'other')[]> = {
  futsal:      ['futsal_a', 'futsal_b'],
  basketball:  ['basketball_a', 'basketball_b'],
  other:       ['other'],
}

export const FACILITY_GROUP_LABELS: Record<FacilityGroup, string> = {
  futsal:      '풋살장',
  basketball:  '농구장',
  other:       '기타 종목',
}
