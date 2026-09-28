export const MAIN_SPECTRUM = { id:'overall', label:'Overall HISTI', leftCode:'P', leftLabel:'Private', rightCode:'O', rightLabel:'Open' };

export const TOPIC_SPECTRA = {
  identity:{ id:'identity', label:'Identity', leftCode:'A', leftLabel:'Anonymous', rightCode:'I', rightLabel:'Identifiable' },
  relationships:{ id:'relationships', label:'Relationships', leftCode:'G', leftLabel:'General', rightCode:'S', rightLabel:'Specific' },
  work:{ id:'work', label:'Work & education', leftCode:'B', leftLabel:'Broad', rightCode:'D', rightLabel:'Detailed' },
  location:{ id:'location', label:'Location', leftCode:'C', leftLabel:'Coarse', rightCode:'T', rightLabel:'Traceable' },
  routine:{ id:'routine', label:'Routine', leftCode:'U', leftLabel:'Unpredictable', rightCode:'P', rightLabel:'Predictable' },
  health:{ id:'health', label:'Health', leftCode:'G', leftLabel:'General', rightCode:'D', rightLabel:'Detailed' },
  financial:{ id:'financial', label:'Financial', leftCode:'B', leftLabel:'Broad', rightCode:'E', rightLabel:'Exact' },
  files:{ id:'files', label:'Files & communications', leftCode:'R', leftLabel:'Restricted', rightCode:'X', rightLabel:'Extensive' },
  credentials:{ id:'credentials', label:'Credentials', leftCode:'S', leftLabel:'Sealed', rightCode:'A', rightLabel:'Actionable' },
  events:{ id:'events', label:'Life events', leftCode:'M', leftLabel:'Mentioned', rightCode:'D', rightLabel:'Documented' }
};

export function clamp(value,min,max){ return Math.min(max,Math.max(min,value)); }
export function exposureToSignedScore(exposure){
  if(exposure===null || !Number.isFinite(Number(exposure))) return null;
  return Math.round(clamp(Number(exposure),0,1)*200-100);
}
export function formatSpectrumScore(score,spectrum=MAIN_SPECTRUM){
  if(score===null || !Number.isFinite(Number(score))) return 'N/C';
  const n=Math.round(clamp(Number(score),-100,100));
  if(n===0) return 'N0';
  return `${n<0?spectrum.leftCode:spectrum.rightCode}${Math.abs(n)}`;
}
export function weightedExposure(items){
  let weight=0, achieved=0;
  for(const item of items||[]){
    const w=Number(item?.weight), e=Number(item?.exposure);
    if(!Number.isFinite(w)||w<=0||!Number.isFinite(e)) continue;
    weight+=w; achieved+=w*clamp(e,0,1);
  }
  return weight>0?achieved/weight:null;
}
export function weightedSpectrum(items,spectrum=MAIN_SPECTRUM){
  const exposure=weightedExposure(items);
  const score=exposureToSignedScore(exposure);
  return { exposure, score, display:formatSpectrumScore(score,spectrum) };
}
