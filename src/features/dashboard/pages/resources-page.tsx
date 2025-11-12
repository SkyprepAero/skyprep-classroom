import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const resources = [
  {
    title: 'Physics Formula Sheet',
    category: 'Reference',
    updatedAt: 'Updated 2 days ago',
  },
  {
    title: 'Organic Chemistry Mindmap',
    category: 'Notes',
    updatedAt: 'Updated 5 days ago',
  },
  {
    title: 'Mathematics Strategy Guide',
    category: 'Playbook',
    updatedAt: 'Updated 1 week ago',
  },
]

export function ResourcesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Resource Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download curated study material and revision notes shared by mentors.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource) => (
          <Card key={resource.title}>
            <CardHeader>
              <CardTitle>{resource.title}</CardTitle>
              <CardDescription>{resource.category}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {resource.updatedAt}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

