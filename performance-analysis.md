# 성능 병목 현상 분석 및 최적화 방안

## 현재 발견된 성능 문제점

### 1. **Firebase 인증 중복 (가장 큰 문제)**
- `firebaseDataFetcher.ts`에서 `fetchCameraTasks()` 호출 시마다 `initialize()`로 재인증
- 매번 익명 로그인을 수행하여 2-3초 지연 발생

### 2. **동기적 API 호출**
- Firebase와 GitHub API를 순차적으로 호출
- 병렬 처리 가능한 작업을 직렬로 처리

### 3. **전체 데이터 조회**
- Firebase에서 모든 tasks를 가져온 후 필터링
- 클라이언트 사이드 필터링으로 불필요한 데이터 전송

### 4. **Gemini AI 호출 지연**
- 외부 API 호출로 1-2초 추가 지연
- 네트워크 상태에 따라 더 길어질 수 있음

## 최적화 방안

### 1. Firebase 인증 싱글톤 패턴 적용
```typescript
// firebaseDataFetcher.ts 수정
private static instance: FirebaseDataFetcher;
private static isInitialized = false;

static getInstance(): FirebaseDataFetcher {
  if (!FirebaseDataFetcher.instance) {
    FirebaseDataFetcher.instance = new FirebaseDataFetcher();
  }
  return FirebaseDataFetcher.instance;
}

async initialize(): Promise<void> {
  if (FirebaseDataFetcher.isInitialized) return;
  
  try {
    await signInAnonymously(this.auth);
    FirebaseDataFetcher.isInitialized = true;
    console.log('Authenticated with Firebase anonymously');
  } catch (error) {
    console.error('Firebase authentication error:', error);
  }
}
```

### 2. 병렬 처리 구현
```typescript
// reportGenerator.ts 수정
async generateReport(): Promise<boolean> {
  try {
    console.log('Starting report generation...');
    
    // 병렬로 데이터 수집
    const [firebaseTasks, githubTasks] = await Promise.all([
      this.firebaseFetcher.fetchCameraTasks(),
      this.githubFetcher.fetchRecentActivities().catch(() => [])
    ]);
    
    // 나머지 로직...
  }
}
```

### 3. Firebase 쿼리 최적화
```typescript
// Aiden Kim 업무만 쿼리
async fetchCameraTasks(): Promise<Task[]> {
  await this.initialize();
  
  const tasksCollection = collection(this.db, 'tasks');
  const q = query(tasksCollection, 
    where('assignees', 'array-contains', 'Aiden Kim')
  );
  const tasksSnapshot = await getDocs(q);
  
  // 처리 로직...
}
```

### 4. 캐싱 구현
```typescript
// 5분간 캐시 유지
private static cache: { tasks: Task[], timestamp: number } | null = null;
private static CACHE_DURATION = 5 * 60 * 1000; // 5분

async fetchCameraTasks(): Promise<Task[]> {
  // 캐시 확인
  if (FirebaseDataFetcher.cache && 
      Date.now() - FirebaseDataFetcher.cache.timestamp < FirebaseDataFetcher.CACHE_DURATION) {
    console.log('Using cached tasks');
    return FirebaseDataFetcher.cache.tasks;
  }
  
  // 새로 조회
  const tasks = await this.fetchFromFirebase();
  FirebaseDataFetcher.cache = { tasks, timestamp: Date.now() };
  return tasks;
}
```

### 5. 타임아웃 설정
```typescript
// 각 작업에 타임아웃 설정
const fetchWithTimeout = <T>(promise: Promise<T>, timeout: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
};

// 사용
const firebaseTasks = await fetchWithTimeout(
  this.firebaseFetcher.fetchCameraTasks(), 
  10000 // 10초
);
```

## 예상 개선 효과

| 작업 | 현재 시간 | 개선 후 | 절감 |
|------|-----------|---------|------|
| Firebase 인증 | 2-3초 | 0초 (캐시) | 2-3초 |
| 데이터 수집 | 순차 5-6초 | 병렬 3초 | 2-3초 |
| 전체 처리 | 10-15초 | 5-7초 | 5-8초 |

## 즉시 적용 가능한 수정

가장 효과적인 두 가지 수정:
1. Firebase 인증을 한 번만 수행
2. Firebase와 GitHub 데이터를 병렬로 수집

이 두 가지만 적용해도 약 50% 성능 개선 예상됩니다.