class Form extends React.Component {
    constructor(props) {
      super(props);

      this.state = {};

      this.props.tags.forEach((tag) => {
        if (tag.tag === 'input') {
          if (tag.type === 'radio') {
          } else {
            Object.assign(this.state, { [tag.id || tag.name]: tag.value });
          }
        }
      });
    }

    handleSubmit(e) {
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();

      const values = this.props.tags.reduce((o, tag) => {
        if (tag.type === 'radio') {
          return Object.assign(o, { [tag.name]: this.state[tag.name] })
        } else {
          return Object.assign(o, { [tag.id || tag.name]: this.state[tag.id || tag.name] })
        }
      }, {});
      console.log('values', values);
      this.props.onSubmit && this.props.onSubmit(values);
    }

    handleChange(e, tag) {
      console.log('tag', tag, 'e', e);
      if (tag.tag === 'input') {
        if (tag.type === 'radio') {
          console.log('setState',)
          this.setState({
            [tag.name]: e.target.value,
          });
        } else {
          this.setState({
            [tag.id || tag.name]: e.target.value,
          });
        }
      }
    }

    render() {
      return (
        <form onSubmit={e => this.handleSubmit(e)}>
          {this.props.tags.map((tag, i) => (
            <div>
              {tag.tag === 'p' && <p>{tag.text}</p>}

              {tag.tag === 'input' && (tag.type === 'text' || tag.type === 'password') && (<div className="form-group">
                <label htmlFor={`form-input-${i}`}>{tag.description}</label>
                <input id={`form-input-${i}`} type={tag.type} className="form-control" value={this.state[tag.id || tag.name]} placeholder={tag.description} onChange={e => this.handleChange(e, tag)} />
              </div>)}

              {tag.tag === 'input' && tag.type === 'hidden' && (<input id={`form-input-${i}`} type={tag.type} value={this.state[tag.id || tag.name]} />)}

              {tag.tag === 'input' && tag.type === 'radio' && (<div className="radio">
                <label>
                  <input type={tag.type} value={tag.value} name={tag.name} onChange={e => this.handleChange(e, tag)} checked={this.state[tag.name] === tag.value} />
                  {tag.description}
                </label>
              </div>)}

              {tag.tag === 'img' && <img src={tag.src}/>}
            </div>
          ))}
          <button type="submit" className="btn btn-default btn-lg">Submit</button>
        </form>
      );
    }
  }

  class App extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        userId: localStorage.getItem('userId'),
        begun: false,
        vaultProxy: undefined,
      };
    }

    async fetch(body) {
      try {
        const response = await fetch('/bots/' + (window.bot) + '/run', {
          method: 'POST',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const json = await response.json();

        if (response.status !== 200) {
          this.setState({
            sessId: null,
            tags: null,
            error: json.message || json.error,
            session: null,
            begun: false,
          });

          return false;
        }

        if (body.userId) {
          localStorage.setItem('userId', body.userId);
        }

        this.setState({
          sessId: json.sessId || this.state.sessId,
          tags: json.tags,
          error: json.error,
          session: json.session,
          spec: JSON.stringify({ userId: json.userId, retailerUserId: json.retailerUserId, session: json.session }),
        });

        console.log(json);
      } catch (error) {
        console.error(error.stack);
        this.setState({
          error: error.stack,
        });
      }
    }

    begin(e) {
      if (e) {
        e.preventDefault && e.preventDefault();
        e.stopPropagation && e.stopPropagation();
      }

      if (this.state.begun) {
        location.href = location.href;
        return false;
      }

      if (!this.state.userId) {
        alert('Required field "User ID" is empty.');
        return false;
      }

      this.setState({ begun: true });

      const session = JSON.parse(this.state.userInputSession || '{}');
      this.fetch(Object.assign({ interactive: true, userId: this.state.userId, vaultProxy: this.state.vaultProxy }, session));
    }

    handleSubmit(values) {
      Object.assign(values);
      this.fetch({ reply: values, sessId: this.state.sessId, userId: this.state.userId });
      this.setState({ tags: null, error: null });
    }

    render() {
      return (
        <div className='container'>
          <div className="header clearfix">
            <h3 className="text-muted">{`${(window.bot || 'chase-signin-0')} bot poc`}</h3>
          </div>

          <h4>Configurations</h4>
          <form className="form-horizontal">
            <div className="form-group">
              <label htmlFor="inputUserId" className="col-sm-2 control-label">UID</label>
              <div className="col-sm-10">
                <input value={this.state.userId} disabled={this.state.begun ? 'disabled': undefined} type="text" className="form-control" id="inputUserId" placeholder="User ID" onChange={e => this.setState({ userId: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="inputVaultProxy" className="col-sm-2 control-label">session</label>
              <div className="col-sm-10">
                <input value={this.state.userInputSession} disabled={this.state.begun ? 'disabled': undefined} type="text" className="form-control" id="inputSession" placeholder="session" onChange={e => this.setState({ userInputSession: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <div className="col-sm-offset-2 col-sm-10">
                {<button className='btn btn-lg btn-success' onClick={(e) => this.begin(e)}>{this.state.begun ? 'Restart' : 'Start'}</button>}
              </div>
            </div>
          </form>

          {this.state.begun && <h4>Bot Interaction</h4>}
          {this.state.error && <div className='alert alert-danger' role='alert'>{this.state.error}</div>}
          {this.state.begun && this.state.tags && <Form onSubmit={(values) => this.handleSubmit(values)} tags={this.state.tags} />}
          {this.state.begun && this.state.session && <div><h5>successful</h5><pre>{this.state.spec}</pre></div>}
          {this.state.begun && this.state.session && <div><h5>session</h5><pre>{this.state.session}</pre></div>}
          {this.state.begun && !this.state.error && !this.state.tags && !this.state.session && <h5>loading...</h5>}
        </div>
      );
    }
  }

  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );
