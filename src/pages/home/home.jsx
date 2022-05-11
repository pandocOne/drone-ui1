import classNames from 'classnames/bind';
import React, {
  useEffect, useState, useMemo, useContext,
} from 'react';

import Repos from 'components/pages/home/repos';
import ReposRecent from 'components/pages/home/repos-recent';
import Button from 'components/shared/button';
import Input from 'components/shared/form/input';
import Select from 'components/shared/form/select';
import Switch from 'components/shared/switch';
import ZeroState from 'components/shared/zero-state';
import { AppContext } from 'context';
import { useLocalStorage, useCustomTitle, useToast } from 'hooks';
import { useStore } from 'hooks/store';
import { useViewer, useSyncAccount } from 'hooks/swr';
import { byBuildCreatedAtDesc, byRepoNameAsc } from 'utils';

import styles from './home.module.scss';

const cx = classNames.bind(styles);

// amount of repos to be shown initially and increased by
// on show more click
const REPOS_CHUNK_SIZE = 50;

const RECENT_ACTIVITY = '按最近活跃排序';
const NAME = '按名称排序';
const sortEnums = [RECENT_ACTIVITY, NAME];

export default function Home() {
  const [context, setContext] = useContext(AppContext);
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [isActiveOnly, setIsActiveOnly] = useLocalStorage('home_show_active_only_repos', false);
  const [sortBy, setSortBy] = useLocalStorage('home_sort_repos_by', sortEnums[0]);
  const [filterOrg, setFilterOrg] = useLocalStorage('home_org_repos', '');
  const [shouldStartSync, setShouldStartSync] = useState(context.isAccSyncing);
  const { showError } = useToast();
  const { hasSyncReqFiredOff, isError: syncError } = useSyncAccount(shouldStartSync);

  const { isSynced, isSyncing, isError: viewerError } = useViewer({ withPolling: hasSyncReqFiredOff });

  const {
    repos, orgs, error, reload, reloadOnce,
  } = useStore();
  const data = repos ? Object.values(repos) : undefined;
  const isLoading = !data && !error;
  useEffect(() => reloadOnce(), [reloadOnce]);
  useCustomTitle();

  const [filter, setFilter] = useState('');

  const filtered = useMemo(
    () => data?.slice(0)
      .filter((repo) => (isActiveOnly ? repo.active : !!repo))
      .filter((repo) => (filterOrg ? repo.namespace === filterOrg : !!repo))
      .filter((item) => item.slug.indexOf(filter) > -1) ?? [],
    [data, filter, isActiveOnly, filterOrg],
  );

  const sorted = useMemo(
    () => filtered
      .slice(0)
      .sort(sortBy === NAME ? byRepoNameAsc : byBuildCreatedAtDesc)
      .slice(0, showAllRepos ? filtered.length : REPOS_CHUNK_SIZE) ?? [],
    [filtered, showAllRepos, sortBy],
  );

  const recent = useMemo(
    () => data?.slice(0).sort(byBuildCreatedAtDesc).filter((repo) => !!repo.build)?.slice(0, 6) ?? [],
    [data],
  );

  const orgOptions = useMemo(() => {
    if (!orgs) return [{ value: '', key: '所有组织' }];
    const returnOrgs = orgs?.map((org) => ({ value: org, key: org }));
    return [{ value: '', key: '所有组织' }, ...returnOrgs];
  }, [orgs]);

  const sortOptions = sortEnums.map((option) => ({ value: option, key: option }));

  useEffect(() => {
    if (syncError || viewerError) {
      setContext({ ...context, isAccSyncing: false });
      showError('发生同步错误，请重试');
      console.error('同步错误:', syncError?.message || viewerError?.message); // eslint-disable-line no-console
    }
  }, [syncError, viewerError, showError, context, setContext]);

  useEffect(() => {
    if (isSynced) {
      setShouldStartSync(false);
      reload();
      if (context.isAccSyncing) {
        setContext({ ...context, isAccSyncing: false });
      }
    }
  }, [isSynced, context, setContext, reload]);

  const handleSyncClick = () => setShouldStartSync(true);

  const handleLoadMoreClick = () => setShowAllRepos(true);

  const handleFilter = (e) => setFilter(e.target.value.trim());

  let content = null;

  if (isLoading) {
    content = null;
  } else if (data?.length) {
    content = (
      <>
        <div className={cx('subheader')}>
          <h2 className={cx('section-title')}>库</h2>
          <div className={cx('actions')}>
            <Switch
              id="active-switch"
              checked={isActiveOnly}
              onChange={(val) => setIsActiveOnly(val)}
            >
              只显示活跃的库
            </Switch>
            <Select value={sortBy} optionsList={sortOptions} onChange={(e) => setSortBy(e.target.value)} />
            <Select value={filterOrg} optionsList={orgOptions} onChange={(e) => setFilterOrg(e.target.value)} />
            <Input
              placeholder="过滤器 …"
              icon="search"
              className={cx('search')}
              width={300}
              name="repo-search"
              onChange={handleFilter}
            />
          </div>
        </div>
        <Repos repos={sorted} />
        {!showAllRepos && sorted.length >= REPOS_CHUNK_SIZE && (
        <Button
          className={cx('btn', 'btn-show-more')}
          onClick={handleLoadMoreClick}
        >
          显示更多 &#8595;
        </Button>
        )}
      </>
    );
  } else {
    content = (
      <ZeroState
        title="库列表为空."
        message="Drone自动同步你的版本控制系统以显示你的库."
      />
    );
  }

  return (
    <>
      <header className={cx('header')}>
        <h1>仪表盘</h1>
        <button
          type="button"
          className={cx('btn', 'btn-sync')}
          disabled={isSyncing || hasSyncReqFiredOff}
          onClick={handleSyncClick}
        >
          {(isSyncing || hasSyncReqFiredOff) && (
            <span className={cx('btn-sync-spinner')} />
          )}
          {(isSyncing || hasSyncReqFiredOff) ? '同步中' : '同步'}
        </button>
      </header>
      <section className={cx('wrapper')}>
        {!!recent.length && (
        <>
          <h2 className={cx('section-title', 'section-title-recent')}>最近活跃</h2>
          <ReposRecent repos={recent} />
        </>
        )}
        {content}
      </section>
    </>
  );
}
