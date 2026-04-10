import { PrismaClient } from '@prisma/client';

const STATE_ROW_ID = 'global';

let prismaClient = null;
let inMemoryState = {
  projects: [],
  selectedProjectId: null,
};

function getPrismaClient() {
  const databaseUrl = typeof process.env.DATABASE_URL === 'string' ? process.env.DATABASE_URL.trim() : '';
  if (!databaseUrl) {
    return null;
  }

  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }

  return prismaClient;
}

function normalizeStatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      projects: [],
      selectedProjectId: null,
    };
  }

  const record = payload;
  const projects = Array.isArray(record.projects) ? record.projects : [];
  const selectedProjectId =
    typeof record.selectedProjectId === 'string' && record.selectedProjectId.trim().length > 0
      ? record.selectedProjectId.trim()
      : null;

  return {
    projects,
    selectedProjectId,
  };
}

export async function loadPassportStateFromDb() {
  const prisma = getPrismaClient();

  if (!prisma) {
    return normalizeStatePayload(inMemoryState);
  }

  const row = await prisma.passportState.findUnique({
    where: {
      id: STATE_ROW_ID,
    },
  });

  if (!row) {
    return {
      projects: [],
      selectedProjectId: null,
    };
  }

  return normalizeStatePayload({
    projects: row.projects,
    selectedProjectId: row.selectedProjectId,
  });
}

export async function savePassportStateToDb(payload) {
  const normalized = normalizeStatePayload(payload);
  const prisma = getPrismaClient();

  if (!prisma) {
    inMemoryState = normalized;
    return {
      ok: true,
    };
  }

  await prisma.passportState.upsert({
    where: {
      id: STATE_ROW_ID,
    },
    create: {
      id: STATE_ROW_ID,
      projects: normalized.projects,
      selectedProjectId: normalized.selectedProjectId,
    },
    update: {
      projects: normalized.projects,
      selectedProjectId: normalized.selectedProjectId,
    },
  });

  return {
    ok: true,
  };
}

export async function disconnectPassportStateDb() {
  if (!prismaClient) {
    return;
  }

  await prismaClient.$disconnect();
  prismaClient = null;
}
