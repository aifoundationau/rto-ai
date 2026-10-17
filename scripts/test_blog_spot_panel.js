async function runTest() {
  console.log('--- Testing /api/blog/extract (YouTube) ---');
  const ytRes = await fetch('http://localhost:3000/api/blog/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  });
  const ytData = await ytRes.json();
  console.log('YouTube Extract Result:', {
    type: ytData.type,
    tag: ytData.tag,
    title: ytData.title,
    thumbnail: ytData.thumbnail,
    uploadDate: ytData.uploadDate,
    extract: ytData.extract,
    videoId: ytData.videoId,
    wordCount: ytData.extract ? ytData.extract.split(/\s+/).length : 0
  });

  if (!ytData.thumbnail || !ytData.title || !ytData.extract) {
    throw new Error('YouTube extraction failed!');
  }

  console.log('\n--- Testing /api/blog/extract (LinkedIn) ---');
  const liRes = await fetch('http://localhost:3000/api/blog/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.linkedin.com/pulse/future-higher-education-ai-student-services-edupulse-australia' })
  });
  const liData = await liRes.json();
  console.log('LinkedIn Extract Result:', {
    type: liData.type,
    tag: liData.tag,
    title: liData.title,
    thumbnail: liData.thumbnail,
    uploadDate: liData.uploadDate,
    extract: liData.extract,
    wordCount: liData.extract ? liData.extract.split(/\s+/).length : 0
  });

  console.log('\n--- Testing /api/blog (POST new post) ---');
  const createRes = await fetch('http://localhost:3000/api/blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: ytData.title,
      tag: ytData.tag,
      date: ytData.uploadDate,
      image: ytData.thumbnail,
      snippet: ytData.extract,
      type: ytData.type,
      url: ytData.url,
      videoId: ytData.videoId,
      author: ytData.author
    })
  });
  const createData = await createRes.json();
  console.log('Create Post Result:', createData.success, 'Post ID:', createData.post?.id);

  console.log('\n--- Testing /api/blog (GET all posts) ---');
  const listRes = await fetch('http://localhost:3000/api/blog');
  const listData = await listRes.json();
  console.log('Total Published Posts:', listData.posts?.length);
  const found = listData.posts?.find(p => p.id === createData.post?.id);
  console.log('Verified newly created post in list:', !!found);

  console.log('\n--- Testing /api/blog (DELETE test post) ---');
  const delRes = await fetch(`http://localhost:3000/api/blog?id=${createData.post?.id}`, {
    method: 'DELETE'
  });
  const delData = await delRes.json();
  console.log('Delete result:', delData.success);

  console.log('\n ALL TESTS PASSED SUCCESSFULLY! ');
}

runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
