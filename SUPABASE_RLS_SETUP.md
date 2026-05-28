# Supabase RLS 정책 설정 가이드

## 📌 현재 상황

✅ **완료:**
- Users 테이블에 당신의 사용자 데이터 추가됨
  - 이메일: `2022026042@chungbuk.ac.kr`
  - 닉네임: `등촌볶음밥`

❌ **필요한 작업:**
- Users 테이블에 **INSERT RLS 정책** 추가
- 이것을 해야만 새로운 회원가입이 정상 작동합니다

---

## 🚀 RLS 정책 추가 방법 (5분 소요)

### **Step 1️⃣: Supabase 대시보드 접속**

브라우저에서 다음 URL 열기:
```
https://supabase.com/dashboard
```

### **Step 2️⃣: 프로젝트 접속**

1. 로그인하면 프로젝트 목록이 보임
2. CBNU 프로젝트 또는 당신의 프로젝트 선택
3. (또는 다음 직접 링크 사용)
   ```
   https://supabase.com/dashboard/project/ujvwswedoxsqhkpngeag
   ```

### **Step 3️⃣: SQL Editor 열기**

왼쪽 메뉴에서:
```
Developer → SQL Editor
```

### **Step 4️⃣: SQL 쿼리 복사 & 붙여넣기**

아래 SQL 코드를 복사하여 SQL Editor의 쿼리창에 붙여넣기:

```sql
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
```

### **Step 5️⃣: 실행**

1. 우측 하단의 **"Execute"** 버튼 (또는 Cmd/Ctrl+Enter) 클릭
2. 녹색 체크마크 ✅ 또는 성공 메시지 확인

---

## ✅ 완료 확인

### 브라우저에서 확인:
1. 애플리케이션 재시작:
   ```bash
   npm run dev
   ```

2. `http://localhost:3000/profile` 접속

3. 다음이 보여야 함:
   - ✅ 당신의 이메일: `2022026042@chungbuk.ac.kr`
   - ✅ 당신의 닉네임: `등촌볶음밥`
   - ✅ 학번 정보
   - ✅ 공모전 프로필 / 스포츠 프로필 탭

---

## 🎯 해결되는 문제들

| 문제 | 상태 |
|------|------|
| 프로필 페이지 로딩 에러 | ✅ 해결됨 |
| Users 테이블 비어있음 | ✅ 해결됨 (데이터 추가됨) |
| 회원가입 후 데이터 안 보임 | ✅ 예정 (RLS 정책 추가 후) |
| 새 회원가입 불가능 | ✅ 예정 (RLS 정책 추가 후) |

---

## 🆘 문제가 생겼을 때

### Q1: SQL 실행 후 에러가 발생했을 때
**A:** Supabase 대시보드 → SQL Editor → 새로운 쿼리 클릭하고 다시 시도

### Q2: "정책이 이미 존재한다"는 메시지
**A:** 정상입니다! 정책이 이미 있다는 뜻이므로 다음 단계로 진행

### Q3: 프로필 페이지에서 여전히 데이터가 안 보일 때
**A:** 브라우저 새로고침 (F5 또는 Cmd+R)

---

## 📞 문의사항

문제가 발생하면 브라우저 개발자 도구 (F12) → Console 탭에서 에러 메시지 확인 후 알려주세요.
