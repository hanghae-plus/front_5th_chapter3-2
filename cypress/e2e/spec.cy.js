const getInputByLabel = (label) => {
  return cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then((id) => cy.get(`#${CSS.escape(id)}`));
};

describe('1팀 심화 e2e 테스트', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/events').as('getEvents');
    cy.visit('http://localhost:5173');
    cy.wait('@getEvents');
  });

  it('15일 일정이 추가된다.', () => {
    getInputByLabel('제목').type('입력 테스트');
    getInputByLabel('날짜').type('2025-05-15');
    getInputByLabel('시작 시간').type('09:00');
    getInputByLabel('종료 시간').type('10:00');
    getInputByLabel('설명').type('1팀 심화 테스트');
    getInputByLabel('위치').type('어디든 좋아');
    getInputByLabel('카테고리').select('업무');

    cy.get('[data-testid="event-submit-button"]').click();
  });

  it('15일 일정 제목을 "스터디" 로 수정한다', () => {
    cy.get('[data-testid="event-list"]')
      .contains('2025-05-15')
      .parent()
      .parent()
      .within(() => {
        cy.get('[aria-label="Edit event"]').click();
      });

    getInputByLabel('제목').clear().type('스터디');
    getInputByLabel('위치').clear().type('스터디 좋아');
    cy.get('[data-testid="event-submit-button"]').click();
  });

  it('15일 일정을 삭제한다', () => {
    cy.get('[data-testid="event-list"]')
      .contains('2025-05-15')
      .parent()
      .parent()
      .within(() => {
        cy.get('[aria-label="Delete event"]').click();
      });
  });

  it('일정 검색 시 일치하는 일정만 보여진다', () => {
    getInputByLabel('제목').type('검색 테스트');
    getInputByLabel('날짜').type('2025-05-26');
    getInputByLabel('시작 시간').type('11:00');
    getInputByLabel('종료 시간').type('12:00');
    getInputByLabel('설명').type('검색 설명');
    getInputByLabel('위치').type('회의실 C');
    getInputByLabel('카테고리').select('업무');
    cy.get('[data-testid="event-submit-button"]').click();

    cy.get('[placeholder="검색어를 입력하세요"]').type('검색 테스트');
    cy.get('[data-testid="event-list"]').should('contain.text', '검색 테스트');
  });

  it('주간/월간 뷰 전환이 작동한다', () => {
    cy.get('[aria-label="view"]').select('month');
    cy.get('[data-testid="month-view"]').should('exist');

    cy.get('[aria-label="view"]').select('week');
    cy.get('[data-testid="week-view"]').should('exist');
  });

  it('알림 설정을 "1시간 전"으로 바꿀 수 있다', () => {
    getInputByLabel('제목').type('알림 일정');
    getInputByLabel('날짜').type('2025-05-22');
    getInputByLabel('시작 시간').type('15:00');
    getInputByLabel('종료 시간').type('16:00');
    getInputByLabel('설명').type('알림 설명');
    getInputByLabel('위치').type('회의실 B');
    getInputByLabel('카테고리').select('업무');

    getInputByLabel('알림 설정').select('1시간 전');

    cy.get('[data-testid="event-submit-button"]').click();

    cy.contains('알림: 1시간 전').should('exist');
  });

  it('겹치는 일정을 추가하면 경고 다이얼로그가 뜬다', () => {
    // 먼저 하나 추가
    getInputByLabel('제목').type('겹침 테스트 1');
    getInputByLabel('날짜').type('2025-05-23');
    getInputByLabel('시작 시간').type('10:00');
    getInputByLabel('종료 시간').type('11:00');
    getInputByLabel('설명').type('겹침 테스트 설명');
    getInputByLabel('위치').type('회의실 A');
    getInputByLabel('카테고리').select('업무');
    cy.get('[data-testid="event-submit-button"]').click();

    // 같은 시간에 또 추가
    getInputByLabel('제목').type('겹침 테스트 2');
    getInputByLabel('날짜').type('2025-05-23');
    getInputByLabel('시작 시간').type('10:30'); // 겹치도록
    getInputByLabel('종료 시간').type('11:30');
    cy.get('[data-testid="event-submit-button"]').click();

    cy.contains('일정 겹침 경고').should('exist');
  });

  it('필수 정보 누락 시 에러 Toast가 나타난다', () => {
    // 아무 것도 입력 안 하고 제출
    cy.get('[data-testid="event-submit-button"]').click();

    cy.contains('필수 정보를 모두 입력해주세요.').should('exist');
  });

  it('시작 시간이 종료 시간보다 늦으면 에러가 발생한다', () => {
    getInputByLabel('제목').type('시간 오류 테스트');
    getInputByLabel('날짜').type('2025-05-25');
    getInputByLabel('시작 시간').type('14:00');
    getInputByLabel('종료 시간').type('13:00');

    cy.get('[data-testid="event-submit-button"]').click();
    cy.contains('시간 설정을 확인해주세요.').should('exist');
  });
});
