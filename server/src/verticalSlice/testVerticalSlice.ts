// Test script for Vertical Slice system
// Phase 10: "The Last Train"

import { VerticalSliceOrchestrator } from './verticalSliceOrchestrator.js';
import { PlannedShot } from '../shots/shotPlanner.js';

async function testVerticalSlice() {
  console.log('=== Testing Vertical Slice System ===');
  console.log('Phase 10: "The Last Train"');
  console.log('');
  
  const orchestrator = new VerticalSliceOrchestrator();
  
  // Test film generation
  console.log('1. Generating film from prompt...');
  const prompt = "A lonely man waits at an empty train station at night during rain.";
  
  try {
    const film = await orchestrator.generateFilm(prompt);
    
    console.log('✓ Film generated successfully!');
    console.log('');
    
    // Display film summary
    console.log('2. Film Summary:');
    console.log(orchestrator.getFilmSummary());
    console.log('');
    
    // Display detailed report
    console.log('3. Detailed Report:');
    console.log(orchestrator.getDetailedReport());
    console.log('');
    
    // Validate coherence
    console.log('4. Coherence Validation:');
    const validation = orchestrator.validateFilmCoherence();
    if (validation.valid) {
      console.log('✓ Film is coherent!');
    } else {
      console.log('✗ Coherence issues found:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log('');
    
    // Test progress tracking
    console.log('5. Generation Progress:');
    const progress = orchestrator.getGenerationProgress();
    if (progress) {
      console.log(`  Stage: ${progress.stage}`);
      console.log(`  Progress: ${(progress.progress * 100).toFixed(1)}%`);
      console.log(`  Operation: ${progress.currentOperation}`);
    }
    console.log('');
    
    // Test reset
    console.log('6. Testing reset...');
    orchestrator.reset();
    const currentFilm = orchestrator.getCurrentFilm();
    if (!currentFilm) {
      console.log('✓ Reset successful - no current film');
    } else {
      console.log('✗ Reset failed - film still exists');
    }
    
  } catch (error) {
    console.error('✗ Film generation failed:', error);
  }
  
  console.log('');
  console.log('=== Test Complete ===');
}

// Run test
testVerticalSlice().catch(console.error);

// Additional test functions
function testNarrativeArc() {
  console.log('\n=== Testing Narrative Arc Generation ===');
  
  // Import and test narrative arc generator
  const { generateNarrativeArc, validateArcCoherence } = require('../narrative/narrativeArcGenerator');
  
  const prompt = "A lonely man waits at an empty train station at night during rain.";
  const arc = generateNarrativeArc(prompt);
  
  console.log(`Title: ${arc.title}`);
  console.log(`Duration: ${arc.durationSeconds}s`);
  console.log(`Emotional Beats: ${arc.emotionalProgression.length}`);
  console.log(`Shots: ${arc.shotSequence.length}`);
  
  const warnings = validateArcCoherence(arc);
  if (warnings.length === 0) {
    console.log('✓ Arc is coherent');
  } else {
    console.log('✗ Arc coherence warnings:');
    warnings.forEach((warning: string) => console.log(`  - ${warning}`));
  }
}

function testShotPlanning() {
  console.log('\n=== Testing Shot Planning ===');
  
  // Import and test shot planner
  const { planShotsFromArc, validateShotContinuity } = require('../shots/shotPlanner');
  const { generateNarrativeArc } = require('../narrative/narrativeArcGenerator');
  
  const prompt = "A lonely man waits at an empty train station at night during rain.";
  const arc = generateNarrativeArc(prompt);
  const shots = planShotsFromArc(arc.emotionalProgression, arc.shotSequence);
  
  console.log(`Planned Shots: ${shots.length}`);
  console.log(`Average Duration: ${(shots.reduce((sum: number, shot: any) => sum + shot.durationSeconds, 0) / shots.length).toFixed(1)}s`);
  
  const continuity = validateShotContinuity(shots);
  if (continuity.valid) {
    console.log('✓ Shot continuity is good');
  } else {
    console.log('✗ Shot continuity issues:');
    continuity.issues.forEach((issue: string) => console.log(`  - ${issue}`));
  }
}

function testPacingAnalysis() {
  console.log('\n=== Testing Pacing Analysis ===');
  
  // Import and test pacing analysis
  const { analyzePacing } = require('../shots/pacingPlanner');
  const { generateNarrativeArc } = require('../narrative/narrativeArcGenerator');
  const { planShotsFromArc } = require('../shots/shotPlanner');
  const { sequenceShots } = require('../shots/shotSequencer');
  const { planTransitions } = require('../shots/transitionPlanner');
  
  const prompt = "A lonely man waits at an empty train station at night during rain.";
  const arc = generateNarrativeArc(prompt);
  const shots = planShotsFromArc(arc.emotionalProgression, arc.shotSequence);
  const sequence = sequenceShots(shots, arc.emotionalProgression);
  const transitions = planTransitions(sequence.shots);
  const pacing = analyzePacing(sequence.shots, transitions, arc.emotionalProgression);
  
  console.log(`Overall Tempo: ${pacing.overallTempo}`);
  console.log(`Average Shot Duration: ${pacing.shotDurationProfile.mean.toFixed(1)}s`);
  console.log(`Silence Ratio: ${(pacing.silenceDistribution.silenceRatio * 100).toFixed(1)}%`);
  console.log(`Pacing Issues: ${pacing.pacingIssues.length}`);
  
  if (pacing.pacingIssues.length > 0) {
    console.log('Pacing recommendations:');
    pacing.recommendations.forEach((rec: string) => console.log(`  - ${rec}`));
  }
}

// Run all tests
console.log('Running comprehensive Vertical Slice tests...\n');
testNarrativeArc();
testShotPlanning();
testPacingAnalysis();

console.log('\n=== All Tests Complete ===');