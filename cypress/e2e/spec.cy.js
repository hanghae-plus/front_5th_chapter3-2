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
});
