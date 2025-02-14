import { Group, GroupLabel } from "@ariakit/react";

export default function Example() {
  return (
    <>
      <div id="role">
        <Group>
          <button>button 1</button>
          <button>button 2</button>
          <button>button 3</button>
        </Group>
      </div>

      <div id="label">
        <Group>
          <GroupLabel>My custom label</GroupLabel>
          <button>button</button>
        </Group>
      </div>

      <div id="label-id">
        <Group>
          <GroupLabel id="my-custom-id">My custom label</GroupLabel>
          <button>button</button>
        </Group>
      </div>
    </>
  );
}
