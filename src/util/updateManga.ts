
import Mangasee from "../scrapers/mangasee";
import db from "../db";
import { ScraperResponse } from "../types";
import getMangaProgress from "./getMangaProgress";

const minute = 1e3 * 60;

export default async function updateManga(slug: string, ignoreExisting: boolean = false) {

	let existing = db.get(`manga_cache.${slug}`).value();
	if(existing && existing.savedAt > Date.now() - 30 * minute) return await addInfo(existing);

	let data = await Mangasee.scrape(slug);
	if(data.success) {
		data.savedAt = Date.now(); 
		db.set(`manga_cache.${slug}`, data).write();
	} 
	return await addInfo(data);
}

async function addInfo(data: ScraperResponse) {

	if(data.success) {
		let chapterPromises = data.data.chapters.map(async ch => {
			ch.progress = await getMangaProgress(data.constant.slug, `${ch.season}-${ch.chapter}`);
			return ch;
		});
		await Promise.all(chapterPromises);
	}

	return data
}