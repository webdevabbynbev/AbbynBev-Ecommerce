// app/blog/[slug]/page.jsx

async function getPost(slug) {
  const res = await fetch(
    `https://blog.abbynbev.com/wp-json/wp/v2/posts?slug=${slug}`,
    {
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data[0]; // WP selalu return array
}

export default async function BlogDetail({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    return <p>Artikel tidak ditemukan</p>;
  }

  return (
    <main>
      <h1>{post.title.rendered}</h1>

      <div
        className="wp-content"
        dangerouslySetInnerHTML={{
          __html: post.content.rendered,
        }}
      />
    </main>
  );
}
