import { getCollection } from 'astro:content';
export const categoryName = (name: string) => ({algorithm: '算法', math: '数学', modeling: '数学建模', MonthlyReport: '月度记录', life: '随笔'}[name] || name);
export async function allPosts() {
  return (await getCollection('posts')).sort((a, b) => b.data.date.localeCompare(a.data.date));
}
export const dateLabel = (date: string) => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date)).replaceAll('-', '.');
