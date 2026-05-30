-- 1. 채팅 시스템 테이블 (chat_messages)
CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES recruitment_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 메시지 접근 권한 (RLS)
-- 방장 또는 방에 수락된 멤버만 해당 방의 채팅을 조회하고 쓸 수 있도록 설정
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members and host can view messages" 
ON chat_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM recruitment_rooms r 
    WHERE r.id = chat_messages.room_id AND r.host_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM room_applications p 
    WHERE p.room_id = chat_messages.room_id AND p.applicant_id = auth.uid() AND p.status = 'accepted'
  )
);

CREATE POLICY "Room members and host can insert messages" 
ON chat_messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recruitment_rooms r 
    WHERE r.id = chat_messages.room_id AND r.host_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM room_applications p 
    WHERE p.room_id = chat_messages.room_id AND p.applicant_id = auth.uid() AND p.status = 'accepted'
  )
);

-- Realtime 활성화 (새로운 메시지가 오면 즉시 업데이트되도록)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;


-- 2. 팀원 평가 테이블 (user_evaluations)
CREATE TABLE user_evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES recruitment_rooms(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- 한 방에서 한 명에게 두 번 평가할 수 없도록 방지
    UNIQUE(room_id, reviewer_id, reviewee_id)
);

ALTER TABLE user_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view evaluations" 
ON user_evaluations FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own evaluations" 
ON user_evaluations FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);
