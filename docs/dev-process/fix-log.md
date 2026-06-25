# 修复记录 / Fix Log

> 针对自审/测试发现问题的修复。格式：问题 → 根因 → 修法 → 验证结果。

## 2026-06-25 · toggleVote 取消路径非幂等（high）

- **文件**：`lib/actions/vote.ts`
- **问题**：取消投票路径先 `findUnique` 取 `existing`，再 `prisma.vote.delete({ where: { id: existing.id } })`。两个并发取消请求查到同一 `existing`，第一个删成功，第二个抛 Prisma P2025（record not found），冒泡为未处理异常返回给用户。投票路径已对 P2002 做幂等，取消路径却没有对称处理。
- **根因**：取消是「查 + 删」两步非原子操作，TOCTOU 竞态；删除按 `id` 走且无异常捕获，丢失了与写入路径对称的幂等语义。
- **修法**：删除改用唯一复合键 `where: { proposalId_userId: { proposalId, userId } }`，并 `try/catch` 捕获 `PrismaClientKnownRequestError` 且 `code === 'P2025'`，视为「已取消」(`voted=false`)，与投票路径 P2002→`voted=true` 对称。同步更新 docstring 说明双向幂等。
- **验证**：`npx tsc --noEmit` 通过；`npm run build` 通过。

