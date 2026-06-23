import { prisma } from '../db/prisma.js';

export class BaseService {
    constructor() {
        this.prisma = prisma;
    }
}
