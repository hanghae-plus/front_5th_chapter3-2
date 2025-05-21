const getInputByLabel = (label) => {
  return cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then((id) => cy.get(`#${CSS.escape(id)}`));
};

describe('template spec', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('입력 테스트', () => {
    getInputByLabel('제목').type('입력 테스트');
  });
});
