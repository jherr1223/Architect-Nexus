import path from 'node:path'

// @mitigates SolutionArch:Workspace:Store against path traversal with resolved-root containment checks
export function isPathInside(root: string, target: string): boolean {
  const resolvedRoot = path.resolve(root)
  const resolvedTarget = path.resolve(target)
  const relative = path.relative(resolvedRoot, resolvedTarget)
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
}

export function assertPathInside(root: string, target: string): void {
  if (!isPathInside(root, target)) {
    throw new Error('Path is outside the workspace')
  }
}
