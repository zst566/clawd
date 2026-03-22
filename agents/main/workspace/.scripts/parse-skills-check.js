#!/usr/bin/env node
/**
 * OpenClaw Skills Daily Check Script
 * Compares remote skill list with local cache and identifies skills to analyze
 */

const fs = require('fs');
const path = require('path');

const CACHE_FILE = '/Users/asura.zhou/clawd/agents/main/workspace/memory/skills-cache.json';
const REMOTE_MD = process.argv[2]; // Pass the markdown content as argument

// Read cache
const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

// Parse remote markdown for skills
const skillRegex = /- \[([^\]]+)\]\((https:\/\/clawskills\.sh\/skills\/[^)]+)\)/g;
const remoteSkills = {};
let match;

while ((match = skillRegex.exec(REMOTE_MD)) !== null) {
    const name = match[1].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const url = match[2];
    remoteSkills[name] = url;
}

// Find new skills (in remote but not in cache)
const cacheSkillNames = Object.keys(cache.skills);
const remoteSkillNames = Object.keys(remoteSkills);
const newSkills = remoteSkillNames.filter(name => !cacheSkillNames.includes(name));
const removedSkills = cacheSkillNames.filter(name => !remoteSkillNames.includes(name));

// Find pending skills (status: pending or lastAnalyzed is null)
const pendingSkills = Object.entries(cache.skills)
    .filter(([_, data]) => data.status === 'pending' || !data.lastAnalyzed)
    .map(([name, _]) => name);

console.log('=== OpenClaw Skills Daily Check ===');
console.log(`\nCache last updated: ${cache.lastUpdated}`);
console.log(`Total in cache: ${cache.totalCount}`);
console.log(`Analyzed: ${cache.analyzedCount}`);
console.log(`Pending: ${pendingSkills.length}`);
console.log(`\n--- Changes since last update ---`);
console.log(`New skills found: ${newSkills.length}`);
console.log(`Removed skills: ${removedSkills.length}`);

if (newSkills.length > 0) {
    console.log('\nNew skills to add:');
    newSkills.slice(0, 10).forEach(name => console.log(`  - ${name}: ${remoteSkills[name]}`));
}

console.log('\n--- Skills to analyze this run ---');
// Priority: new skills first, then pending skills (up to 10 total)
const skillsToAnalyze = [...newSkills.slice(0, 5), ...pendingSkills.slice(0, 10 - Math.min(newSkills.length, 5))].slice(0, 10);
skillsToAnalyze.forEach(name => console.log(`  - ${name}`));

console.log('\n--- Next suggested batch (if pending remain) ---');
const remainingPending = pendingSkills.filter(name => !skillsToAnalyze.includes(name));
remainingPending.slice(0, 5).forEach(name => console.log(`  - ${name}`));

console.log(`\nTotal to analyze this run: ${skillsToAnalyze.length}`);

// Export for shell script usage
console.log('\n--- EXPORT ---');
console.log(`SKILLS_TO_ANALYZE="${skillsToAnalyze.join(',')}"`);
console.log(`NEW_COUNT=${newSkills.length}`);
console.log(`REMOVED_COUNT=${removedSkills.length}`);
console.log(`ANALYZE_COUNT=${skillsToAnalyze.length}`);
