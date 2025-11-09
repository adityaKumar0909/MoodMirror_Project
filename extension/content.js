const API_URL = 'http://localhost:3000/analyze';

const analyzedTweets = new Set();

function extractTweetText(article) {
  const tweetTextElement = article.querySelector('[data-testid="tweetText"]');
  if (!tweetTextElement) return null;
  return tweetTextElement.innerText.trim();
}

function createSentimentTags(emotion, topics) {
  const container = document.createElement('div');
  container.className = 'sentiment-tags';

  const emotionTag = document.createElement('span');
  emotionTag.className = `sentiment-tag emotion ${emotion}`;
  emotionTag.textContent = emotion;
  container.appendChild(emotionTag);

  topics.slice(0, 2).forEach(topic => {
    const topicTag = document.createElement('span');
    topicTag.className = 'sentiment-tag topic';
    topicTag.textContent = topic;
    container.appendChild(topicTag);
  });

  return container;
}

function createLoadingIndicator() {
  const loading = document.createElement('div');
  loading.className = 'sentiment-tags';
  const span = document.createElement('span');
  span.className = 'sentiment-loading';
  span.textContent = 'Analyzing...';
  loading.appendChild(span);
  return loading;
}

async function analyzeTweet(text) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing tweet:', error);
    return null;
  }
}

async function processTweet(article) {
  const tweetId = article.getAttribute('data-tweet-id') ||
                  article.querySelector('[href*="/status/"]')?.href ||
                  Math.random().toString(36);

  if (analyzedTweets.has(tweetId)) {
    return;
  }

  const text = extractTweetText(article);
  if (!text) {
    return;
  }

  analyzedTweets.add(tweetId);

  const tweetTextElement = article.querySelector('[data-testid="tweetText"]');
  const targetContainer = tweetTextElement?.parentElement || article;

  const loadingIndicator = createLoadingIndicator();
  targetContainer.appendChild(loadingIndicator);

  const analysis = await analyzeTweet(text);

  loadingIndicator.remove();

  if (analysis && analysis.emotion && analysis.topic) {
    const tags = createSentimentTags(
      analysis.emotion.sentiment,
      analysis.topic.labels
    );
    targetContainer.appendChild(tags);
  }
}

function findTweets() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  articles.forEach(article => {
    processTweet(article);
  });
}

const observer = new MutationObserver((mutations) => {
  findTweets();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

setTimeout(findTweets, 2000);
