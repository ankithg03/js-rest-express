const express = require('express')
const cors = require('cors');

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const app = express()

app.use(express.json())
app.use(cors());

/**
 * /signup rest API
 */
app.post(`/signup`, async (req, res) => {
  const { name, email, posts } = req.body
  console.log('aaa', req)

  const postData = posts
    ? posts.map((post) => {
        return { title: post.title, content: post.content || undefined, image: post.image || undefined }
      })
    : []

  const result = await prisma.user.create({
    data: {
      name,
      email,
      posts: {
        create: postData,
      },
    },
  })
  res.json(result)
})

/**
 * /post rest API - To create a new post
 */
app.post(`/post`, async (req, res) => {
  const { title, content, authorEmail, image } = req.body
  const result = await prisma.post.create({
    data: {
      title: title,
      content,
      author: { connect: { email: authorEmail } },
      image
    },
  })
  res.json(result)
})

/**
 * /post/:id/views to increment the post
 */
app.put('/post/:id/views', async (req, res) => {
  const { id } = req.params

  try {
    const post = await prisma.post.update({
      where: { id: Number(id) },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    res.json(post)
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` })
  }
})

/**
 * Update the post to publish
 */
app.put('/publish/:id', async (req, res) => {
  const { id } = req.params

  try {
    const postData = await prisma.post.findUnique({
      where: { id: Number(id) },
      select: {
        published: true,
      },
    })

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) || undefined },
      data: { published: !postData.published || undefined },
    })
    res.json(updatedPost)
  } catch (error) {
    res.json({ error: `Post with ID ${id} does not exist in the database` })
  }
})

/**
 * Delete a post
 */
app.delete(`/post/:id`, async (req, res) => {
  const { id } = req.params
  const post = await prisma.post.delete({
    where: {
      id: Number(id),
    },
  })
  res.json(post)
})

/**
 * to get all the users signed up
 */
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

/**
 * to get all the users signed up
 */
app.get('/posts', async (req, res) => {
  const posts = await prisma.post.findMany()
  res.json(posts)
})
/**
 * all draft posts by user
 */
app.get('/user/:id/drafts', async (req, res) => {
  const { id } = req.params

  const drafts = await prisma.user
    .findUnique({
      where: {
        id: Number(id),
      },
    })
    .posts({
      where: { published: false },
    })

  res.json(drafts)
})

/**
 * To get the posts
 */
app.get(`/post/:id`, async (req, res) => {
  const { id } = req.params

  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
  })
  res.json(post)
})


/**
 * search post rest api
 */
app.get('/feed', async (req, res) => {
  const { searchString, skip, take, orderBy } = req.query

  const or = searchString
    ? {
        OR: [
          { title: { contains: searchString } },
          { content: { contains: searchString } },
        ],
      }
    : {}

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...or,
    },
    include: { author: true },
    take: Number(take) || undefined,
    skip: Number(skip) || undefined,
    orderBy: {
      updatedAt: orderBy || undefined,
    },
  })

  res.json(posts)
})

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: http://pris.ly/e/js/rest-express#3-using-the-rest-api`),
)
