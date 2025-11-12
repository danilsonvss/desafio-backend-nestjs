const fs = require('fs');
const path = require('path');

const nodeModulesPath = path.join(__dirname, '../node_modules');
const prismaClientPackagePath = path.join(nodeModulesPath, '@prisma/client');
const prismaClientPath = path.join(nodeModulesPath, '.prisma/client');

if (fs.existsSync(prismaClientPath)) {
  try {
    const dotPrismaDir = path.join(prismaClientPackagePath, '.prisma');
    if (!fs.existsSync(dotPrismaDir)) {
      fs.mkdirSync(dotPrismaDir, { recursive: true });
    }
    
    const clientDir = path.join(dotPrismaDir, 'client');
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true });
    }
    
    const defaultSymlink = path.join(clientDir, 'default');
    
    if (fs.existsSync(defaultSymlink)) {
      const stats = fs.lstatSync(defaultSymlink);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(defaultSymlink);
      }
    }
    
    const relativeTarget = path.relative(clientDir, prismaClientPath);
    fs.symlinkSync(relativeTarget, defaultSymlink, 'dir');
    
    console.log('✅ Prisma Client symlink created successfully');
  } catch (error) {
    console.log('⚠️  Could not create Prisma symlink:', error.message);
  }
} else {
  console.log('⚠️  Prisma Client not generated yet. Run: npx prisma generate');
}
