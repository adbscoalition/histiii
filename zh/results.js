import { describeScore } from '../histi4-results.js?v=editorial-1';
import { SHARING_ZH } from './data.js';
const BANDS={
 unscored:['尚未计分','暂时还没有可解读的结果。','目前还没有计分答案。你可以停在这里，也可以回到几道题。留空不代表选择量表中点。'],
 'private-strong':['主要保留隐私','你倾向于把大部分信息留给自己。','在已计入的答案中，你通常选择保密或只分享很少的细节。这只是对这些选择的描述，不表示你从不敞开心扉。'],
 private:['偏向保留隐私','你会分享一些，但更多信息仍留给自己。','你的答案偏向保留信息，或只讲述事情的一小部分。你可能仍乐于讨论某些话题；总分不能呈现这些全部差异。'],
 middle:['接近中间','你的选择介于保留隐私与开放分享之间。','你的答案接近量表中点。可能是你选择了中间档位，也可能是你在某些话题上很开放、在另一些话题上很保密。下方各领域的结果能帮助区分这些情况。'],
 open:['偏向开放分享','不少事情让你觉得可以分享。','在计入的答案中，你更多选择了分享。这可能意味着你愿意深入谈论某些话题，同时仍保留其他细节。这不必是全有或全无的选择。'],
 'open-strong':['主要开放分享','你倾向于分享相当多的信息。','许多计入的答案接近量表的开放端。你设想自己会分享较多信息或细节。这不表示每个话题都让你同样自在，也不表示你应该真的分享。']
};
const CONTEXT={
 G1:'你想到的是自己并不认识的人。随口聊聊兴趣，与讨论私人生活是不同的事；这里会将这些区别保留下来。',
 G2:'你想到的是一位一般认识的人。对方可能知道大致情况，却不了解细节。结果反映的是你还愿意自在地告诉对方些什么。',
 G3:'你想到的是一位朋友。对方可能已经了解你的部分生活，所以请考虑对方还不知道的细节。成为朋友不意味着必须分享全部故事。',
 G4:'你想到的是配偶或伴侣。共同生活也可以保有各自的边界。结果描述的是你所选的答案，而不是你们的亲密程度或关系是否健康。'
};
export function relationship(score,group){
 const key=describeScore(score).key,[label,title,description]=BANDS[key];
 return {key,label,title,description,person:SHARING_ZH[group],context:CONTEXT[group]};
}
const TOPICS={
 A1:{scope:'日常兴趣、偏好、爱好与生活习惯。',prompt:'哪些日常事情容易分享，哪些仍只想留给自己？',
 private:'当你设想向{person}分享时，你的答案把更多日常生活留给了自己，包括喜好、兴趣和日常习惯。这说明你选择分享多少细节，不代表你是否善于社交。',
 middle:'你向{person}分享日常兴趣与习惯的选择接近中间。有些事情可能容易提起，另一些则比较私人。也可能是你在多道题上都选择了中间档位。',
 open:'对于{person}，你的日常生活看起来相对容易分享，包括你喜欢什么、对什么感兴趣、如何度过时间。你的答案偏向让对方多了解这些日常细节。',
 detail:'谈论一首喜欢的歌，与描述整套日常安排并不相同。这个领域汇总了这些日常选择；不妨回想哪些题容易回答，哪些让你犹豫。'},
 A2:{scope:'人生变化、个人里程碑及相关细节。',prompt:'你愿意分享事情发生了、事情的细节，还是两者都不分享？',
 private:'想到{person}时，关于人生变化与个人里程碑，你的答案偏向简单带过，或留给自己。说一件事发生了，与解释相关的一切可以很不一样。',
 middle:'对于{person}，人生事件的选择接近中间。你可能愿意分享基本消息，却不愿透露全部细节，也可能对不同事件有不同感受。仅凭分数看不出你会省略故事的哪一部分。',
 open:'你设想自己会向{person}讲述更多人生变化与里程碑，而不只是给出概要。视具体题目而定，这可能包括事情经过、背景或你的个人体验。',
 detail:'搬家、新工作和困难的变化，不一定让你觉得同样私人。有些事件还涉及他人的故事。你可以谈自己的经历，而不必解释每个细节。'},
 B:{scope:'背景、个人基本情况及联系方式。',prompt:'在这段关系中，哪些基本信息有实际用途？',
 private:'你的选择让{person}知道的个人基本信息较为有限。看似普通的信息，仍可能识别你的身份、让人联系到你，或让人知道比你想透露的更多背景。',
 middle:'对于{person}，基本信息的选择接近中间。你可能愿意提供大致情况，却不愿透露确切信息，也可能对不同信息有不同选择。这两种情况都可能得到相近分数。',
 open:'你较愿意让{person}了解你的基本背景或联系方式。这些是你在设想情境中选择的档位，不是在要求你在这里提供任何真实信息。',
 detail:'大致说明住在哪里，与提供精确地址并不相同。谁在问、需要做什么、信息有多精确，都可能影响你的选择。这个分数不是分享建议。'},
 C:{scope:'更私人的话题，包括财务、健康与位置。',prompt:'讨论敏感话题前，哪些目的或情境对你重要？',
 private:'你的答案把生活中更多敏感部分保留起来，不向{person}透露。这些题涉及健康、财务、位置等私人话题。在这一部分，你主要选择了较少披露。',
 middle:'对于{person}，敏感话题呈现较混合或居中的结果。你可能愿意谈某些话题，却不愿谈另一些，或只给概要而不讲细节。这两种情况都不意味着你必须多说。',
 open:'在计入的答案中，你设想自己会与{person}更详细地讨论敏感信息。这里可能包含健康、财务、位置等很不同的话题，平均分偏开放并不表示它们可以一概而论。',
 detail:'可以想想这次对话本身：为什么要告诉对方、会省略什么、能否改变主意。这不是分享建议；只有你能决定自己的边界。'},
 D:{scope:'高度敏感的身份标识、凭据、文件与记录。',prompt:'无论关系多亲近，你都想保留哪些隐私？切勿在这里分享真实密码或验证码。',
 private:'对于高度敏感的信息，你的答案偏向不让{person}知道。这一领域包含身份证明文件、账户信息、登录凭据等，与普通聊天很不一样的信息。',
 middle:'对于{person}，高度敏感信息的平均结果接近中间。这可能是开放与保密选择的混合，而不是每项信息都让你同样自在。逐题的选择比把平均分当成许可更重要。',
 open:'对于{person}，你在高度敏感信息上的选择偏向开放端。请仅把它理解为假设性答案的描述。这不能证明交出登录凭据、身份证明文件或账户信息是安全的。',
 detail:'开放分数或参考标记都不是披露信息的许可。切勿在 HISTI 输入真实密码、验证码或身份信息。这不是分享建议；关系亲近并不会取消对边界的需要。'}
};
export function topic(key,bucket,group){
 const reading=relationship(bucket.score,group),copy=TOPICS[key],band=reading.key==='middle'?'middle':bucket.score<0?'private':'open';
 return {...reading,scope:copy.scope,prompt:copy.prompt,detail:copy.detail,description:reading.key==='unscored'
  ?'这个领域尚未计分。你可能留待稍后回答、跳过了问题，或选择了不计分的选项。没有分数不等于中性结果。'
  :copy[band].replaceAll('{person}',reading.person)};
}
export function pattern(result,metadata){
 const entries=Object.entries(result.categories).filter(([,b])=>Number.isFinite(b.score));
 let title='多一点背景。',description;
 if(!entries.length)description='还没有已计分领域可供比较。你可以停在这里，或回到一题容易回答的问题。想保留的隐私，不必填写。';
 else if(entries.length===1)description=`目前结果只涵盖“${metadata[entries[0][0]].label}”，不能说明你会如何回答其他话题。你可以稍后再回答，也可以继续留空。`;
 else{const sorted=[...entries].sort((a,b)=>b[1].score-a[1].score),high=sorted[0],low=sorted.at(-1),distinct=high[1].score-low[1].score>=40;
  title=distinct?'看看答案之间的差异。':'把各个领域放在一起看。';
  description=distinct?`你在“${metadata[high[0]].label}”上的答案，比“${metadata[low[0]].label}”更偏向开放端。这个差异值得留意：愿意分享一种信息，不代表对另一种信息也同样自在。`:'你已回答的各领域在量表上较为接近。但每个领域的平均值仍可能包含不同选择。不妨看看，你在哪些具体题目上想多说一点，又在哪些题目上想有所保留。';}
 return {title,description,note:result.answered<result.total?'这仍是不完整的结果。各领域平均值可能来自不同数量的答案，继续作答后，呈现的模式可能改变。':'这些只是各话题的大致平均值，不是对你或你心中对象的评判。'};
}
export function coverage(result){return `已计分 ${result.answered}／${result.total} 题 · 涵盖 ${Object.values(result.categories).filter(b=>b.score!==null).length}／${Object.keys(result.categories).length} 个领域`;}
export const plain = reading => ({description:reading.description.split('。')[0]+'。',detail:reading.detail,context:reading.context});
export const shorten = text => text.split('。')[0]+'。';
export const scoringDetail = (result,{pna,unknown,na}) => `本结果计入 ${result.answered}／${result.total} 题，包括 ${pna} 个“不愿回答”答案（每题计 1 分）。${unknown} 个“我不知道”和 ${na} 个“不适用”答案不计分；另有 ${result.total-result.answered-unknown-na} 题未计分。`;
