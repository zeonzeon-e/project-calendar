/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  // GitHub Pages 배포 시 레포지토리 이름이 필요합니다.
  // 레포지토리 이름이 'project-calendar'가 아니라면 아래 '/project-calendar' 부분을 실제 레포지토리 이름으로 변경해주세요.
  // 사용자 사이트(username.github.io)라면 이 줄을 지워주세요.
  basePath: isProd ? '/project-calendar' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
