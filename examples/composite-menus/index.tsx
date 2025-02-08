import * as Ariakit from "@ariakit/react";
import "./style.css";

function App() {
  const store = Ariakit.useMenuStore();
  return (
    <>
      <Ariakit.CompositeProvider>
        <Ariakit.Composite>
          <Ariakit.CompositeRow>
            <Ariakit.CompositeItem render={<button>Button A1</button>} />

            <Ariakit.CompositeItem
              render={
                <Ariakit.MenuButton store={store}>Menu A2</Ariakit.MenuButton>
              }
            />
            <Ariakit.Menu className="menu" store={store}>
              <Ariakit.MenuItem className="menu-item">Hello</Ariakit.MenuItem>
            </Ariakit.Menu>

            <Ariakit.CompositeItem render={<button>Button A3</button>} />
          </Ariakit.CompositeRow>

          <Ariakit.CompositeRow>
            <Ariakit.CompositeItem render={<button>Button B1</button>} />

            <Ariakit.MenuProvider>
              <Ariakit.CompositeItem
                render={<Ariakit.MenuButton>Menu B2</Ariakit.MenuButton>}
              />
              <Ariakit.Menu className="menu">
                <Ariakit.MenuItem className="menu-item">Hello</Ariakit.MenuItem>
              </Ariakit.Menu>
            </Ariakit.MenuProvider>

            <Ariakit.CompositeItem render={<button>Button B3</button>} />
          </Ariakit.CompositeRow>

          <Ariakit.CompositeRow>
            <Ariakit.CompositeItem render={<button>Button C1</button>} />

            <Ariakit.MenuProvider>
              <Ariakit.CompositeItem
                render={<Ariakit.MenuButton>Menu C2</Ariakit.MenuButton>}
              />
              <Ariakit.Menu className="menu">
                <Ariakit.MenuItem className="menu-item">Hello</Ariakit.MenuItem>
              </Ariakit.Menu>
            </Ariakit.MenuProvider>

            <Ariakit.CompositeItem render={<button>Button C3</button>} />
          </Ariakit.CompositeRow>
        </Ariakit.Composite>
      </Ariakit.CompositeProvider>
    </>
  );
}

export default App;
