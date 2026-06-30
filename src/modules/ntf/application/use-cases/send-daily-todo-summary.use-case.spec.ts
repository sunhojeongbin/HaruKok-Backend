import { TodoRepositoryPort } from '../../../todo/application/ports/todo.repository.port';
import { TodoEntity } from '../../../todo/entities/todo.entity';
import { NtfTokenRepositoryPort } from '../ports/ntf-token.repository.port';
import { PushSenderPort } from '../ports/push-sender.port';
import { SendDailyTodoSummaryUseCase } from './send-daily-todo-summary.use-case';

const USER_A = '7c1e4f2a-9a6b-4a0d-8b12-3f5c6d7e8f90';
const USER_B = '11111111-1111-1111-1111-111111111111';

function buildTodo(overrides: Partial<TodoEntity> = {}): TodoEntity {
  const now = new Date('2026-06-28T00:00:00.000Z');
  return {
    todoId: '3b08e4c3-7f6d-4f99-b05a-3c4d5e6f7081',
    usrId: USER_A,
    ctgId: null,
    rtnId: null,
    content: '운동하기',
    memo: null,
    todoDate: '2026-06-28',
    isCompleted: false,
    completedAt: null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deletedAt: null,
    usr: undefined as never,
    ctg: null,
    rtn: null,
    ...overrides,
  };
}

describe('SendDailyTodoSummaryUseCase', () => {
  let ntfTokenRepository: jest.Mocked<NtfTokenRepositoryPort>;
  let todoRepository: jest.Mocked<Pick<TodoRepositoryPort, 'findTodayByUsers'>>;
  let pushSender: jest.Mocked<PushSenderPort>;
  let useCase: SendDailyTodoSummaryUseCase;

  beforeEach(() => {
    ntfTokenRepository = {
      isReady: jest.fn().mockReturnValue(true),
      upsertToken: jest.fn(),
      removeByUsrAndToken: jest.fn(),
      findAllActiveTokens: jest.fn(),
      deactivateTokens: jest.fn().mockResolvedValue(undefined),
    };
    todoRepository = {
      findTodayByUsers: jest.fn(),
    };
    pushSender = {
      send: jest.fn().mockResolvedValue({ invalidTokens: [] }),
    };
    useCase = new SendDailyTodoSummaryUseCase(
      ntfTokenRepository,
      todoRepository as unknown as TodoRepositoryPort,
      pushSender,
    );
  });

  it('미완료 유무에 따라 다른 메시지를 사용자별로 발송한다', async () => {
    ntfTokenRepository.findAllActiveTokens.mockResolvedValue([
      { usrId: USER_A, fcmToken: 'token-a1' },
      { usrId: USER_A, fcmToken: 'token-a2' },
      { usrId: USER_B, fcmToken: 'token-b1' },
    ]);
    todoRepository.findTodayByUsers.mockResolvedValue([
      buildTodo({ usrId: USER_A, content: '러닝', isCompleted: false }),
      buildTodo({ usrId: USER_B, content: '독서', isCompleted: true }),
    ]);

    const report = await useCase.execute();

    expect(report).toEqual({ targetedUsers: 2, sentUsers: 2 });
    expect(pushSender.send.mock.calls).toEqual([
      [
        ['token-a1', 'token-a2'],
        { title: '오늘 할 일이 1개 남았어요', body: '- 러닝' },
      ],
      [['token-b1'], { title: '하루콕', body: '오늘 남은 할 일이 없어요' }],
    ]);
  });

  it('활성 토큰이 없으면 아무것도 발송하지 않는다', async () => {
    ntfTokenRepository.findAllActiveTokens.mockResolvedValue([]);

    const report = await useCase.execute();

    expect(report).toEqual({ targetedUsers: 0, sentUsers: 0 });
    expect(todoRepository.findTodayByUsers.mock.calls).toHaveLength(0);
    expect(pushSender.send.mock.calls).toHaveLength(0);
  });

  it('무효 토큰을 모아 비활성화한다', async () => {
    ntfTokenRepository.findAllActiveTokens.mockResolvedValue([
      { usrId: USER_A, fcmToken: 'token-a1' },
    ]);
    todoRepository.findTodayByUsers.mockResolvedValue([]);
    pushSender.send.mockResolvedValue({ invalidTokens: ['token-a1'] });

    await useCase.execute();

    expect(ntfTokenRepository.deactivateTokens.mock.calls).toEqual([
      [['token-a1']],
    ]);
  });

  it('한 사용자 발송 실패가 다른 사용자 발송을 막지 않는다', async () => {
    ntfTokenRepository.findAllActiveTokens.mockResolvedValue([
      { usrId: USER_A, fcmToken: 'token-a1' },
      { usrId: USER_B, fcmToken: 'token-b1' },
    ]);
    todoRepository.findTodayByUsers.mockResolvedValue([]);
    pushSender.send
      .mockRejectedValueOnce(new Error('fcm error'))
      .mockResolvedValueOnce({ invalidTokens: [] });

    const report = await useCase.execute();

    expect(pushSender.send.mock.calls).toHaveLength(2);
    expect(report).toEqual({ targetedUsers: 2, sentUsers: 1 });
  });
});
