<script lang="ts">
  import { Alert, Avatar, Badge, Card, Heading, Rating, Span } from "flowbite-svelte";
</script>

<Card padding="xs" size="none">
  <div class="flex gap-2 items-center">
    <div>
      <Avatar rounded={true} size="md" />
    </div>
    <div>
      <Heading tag="h4">Enterprise name</Heading>

      <Badge color="blue">mécène (lyon uniquement, badge ou étoile, ou nom de couleur difference)</Badge>
      <div>
        <Rating rating={2.5} />
      </div>
    </div>
  </div>
  <Alert color="dark" border class="mt-2 p-2">
    Lorem ipsum patate confite lulemair is a @#$!

    <div class="mt-2 flex flex-wrap gap-1">
      <Badge color="dark">2000 (annee debut contrat)</Badge>
      <Badge color="dark">Apprenticeship</Badge>
      <Badge color="dark">2 years</Badge>
    </div>
  </Alert>
</Card>
